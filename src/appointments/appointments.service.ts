import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User, UserType } from '../users/entities/user.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { Service } from '../services/entities/service.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponsService } from '../coupons/coupons.service';
import { ReviewsService } from '../reviews/reviews.service';
import {
  AppointmentStatus,
  BARBER_CANCEL_REASONS,
  CANCEL_REASON_LABELS,
  CancelledBy,
  CancelReason,
  CLIENT_CANCEL_REASONS,
} from './enums/appointment-status.enum';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

function mapService(s: Service) {
  return {
    id: s.ID,
    name: s.NAME,
    price: +s.PRICE,
    duration_minutes: s.DURATION_MINUTES,
  };
}

const MAX_COMPLETION_ATTEMPTS = 5;
const COMPLETION_LOCK_MINUTES = 15;

function generateCompletionCode(): string {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
}

function priceFields(services: Service[], coupon?: Coupon | null) {
  const original = +services.reduce((sum, s) => sum + +s.PRICE, 0).toFixed(2);
  const total = coupon
    ? +(original * (1 - coupon.DISCOUNT_PERCENT / 100)).toFixed(2)
    : original;
  return {
    coupon: coupon
      ? { code: coupon.CODE, discount_percent: coupon.DISCOUNT_PERCENT }
      : null,
    original_price: original,
    total_price: total,
  };
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private repo: Repository<Appointment>,
    @InjectRepository(Barber) private barbersRepo: Repository<Barber>,
    @InjectRepository(Service) private servicesRepo: Repository<Service>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private notifications: NotificationsService,
    private couponsService: CouponsService,
    private reviewsService: ReviewsService,
  ) {}

  async findAll(filters: {
    requestUserId: string;
    requestUserType: UserType;
    date?: string;
    status?: AppointmentStatus;
  }) {
    let barberId: string | undefined;

    if (filters.requestUserType === UserType.BARBER) {
      const barber = await this.barbersRepo.findOne({
        where: { USER: { ID: filters.requestUserId } },
      });
      if (barber) barberId = barber.ID;
    }

    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.BARBER', 'barber')
      .leftJoinAndSelect('a.CLIENT', 'client')
      .leftJoinAndSelect('a.SERVICES', 'services')
      .leftJoinAndSelect('a.COUPON', 'coupon')
      .orderBy('a.TIME', 'ASC');

    if (barberId) qb.andWhere('barber.ID = :barberId', { barberId });
    if (filters.date) qb.andWhere('a.DATE = :date', { date: filters.date });
    if (filters.status)
      qb.andWhere('a.APPOINTMENT_STATUS = :status', { status: filters.status });

    const appointments = await qb.getMany();

    const reviews = await this.reviewsService.reviewsByAppointmentIds(
      appointments.map((a) => a.ID),
    );

    return appointments.map((a) => ({
      id: a.ID,
      date: a.DATE,
      time: a.TIME,
      appointment_status: a.APPOINTMENT_STATUS,
      client: a.CLIENT
        ? {
            id: a.CLIENT.ID,
            user: {
              id: a.CLIENT.ID,
              name: a.CLIENT.NAME,
              email: a.CLIENT.EMAIL,
            },
          }
        : null,
      services: a.SERVICES?.map(mapService) ?? [],
      ...priceFields(a.SERVICES ?? [], a.COUPON),
      cancel_reason: a.CANCEL_REASON ?? null,
      cancel_note: a.CANCEL_NOTE ?? null,
      cancelled_by: a.CANCELLED_BY ?? null,
      cancelled_at: a.CANCELLED_AT ?? null,
      completed_at: a.COMPLETED_AT ?? null,
      reviewed: reviews.has(a.ID),
      review: reviews.get(a.ID) ?? null,
    }));
  }

  async findMine(clientUserId: string) {
    const appointments = await this.repo.find({
      where: { CLIENT: { ID: clientUserId } },
      relations: { BARBER: true, SERVICES: true, COUPON: true },
      order: { DATE: 'DESC', TIME: 'DESC' },
    });

    const reviews = await this.reviewsService.reviewsByAppointmentIds(
      appointments.map((a) => a.ID),
    );

    return appointments.map((a) => ({
      id: a.ID,
      date: a.DATE,
      time: a.TIME,
      appointment_status: a.APPOINTMENT_STATUS,
      barber: {
        id: a.BARBER.ID,
        shop_name: a.BARBER.SHOP_NAME,
      },
      services: a.SERVICES.map(mapService),
      reviewed: reviews.has(a.ID),
      ...priceFields(a.SERVICES, a.COUPON),
      cancel_reason: a.CANCEL_REASON ?? null,
      cancel_note: a.CANCEL_NOTE ?? null,
      cancelled_by: a.CANCELLED_BY ?? null,
      cancelled_at: a.CANCELLED_AT ?? null,
      completed_at: a.COMPLETED_AT ?? null,
      completion_code: a.COMPLETION_CODE ?? null,
      review: reviews.get(a.ID) ?? null,
    }));
  }

  async findOne(
    id: string,
    requestUserId: string,
    requestUserType: UserType,
  ) {
    const appointment = await this.repo.findOne({
      where: { ID: id },
      relations: {
        BARBER: { USER: true },
        CLIENT: true,
        SERVICES: true,
        COUPON: true,
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const isOwnerClient =
      requestUserType === UserType.CLIENT &&
      appointment.CLIENT?.ID === requestUserId;
    
    const review =
      (
        await this.reviewsService.reviewsByAppointmentIds([appointment.ID])
      ).get(appointment.ID) ?? null;

    return this.mapAppointment(
      appointment,
      isOwnerClient,
      review,
      review != null,
    );
  }

  private mapAppointment(
    a: Appointment,
    includeCompletionCode = false,
    review: {
      rating: number;
      comment: string | null;
      created_at: Date;
    } | null = null,
    reviewed = false,
  ) {
    return {
      id: a.ID,
      date: a.DATE,
      time: a.TIME,
      appointment_status: a.APPOINTMENT_STATUS,
      barber: a.BARBER
        ? { id: a.BARBER.ID, shop_name: a.BARBER.SHOP_NAME }
        : null,
      client: a.CLIENT
        ? { id: a.CLIENT.ID, name: a.CLIENT.NAME, email: a.CLIENT.EMAIL }
        : null,
      services: a.SERVICES?.map(mapService) ?? [],
      ...priceFields(a.SERVICES ?? [], a.COUPON),
      cancel_reason: a.CANCEL_REASON ?? null,
      cancel_note: a.CANCEL_NOTE ?? null,
      cancelled_by: a.CANCELLED_BY ?? null,
      cancelled_at: a.CANCELLED_AT ?? null,
      completed_at: a.COMPLETED_AT ?? null,
      reviewed,
      review,
      ...(includeCompletionCode
        ? { completion_code: a.COMPLETION_CODE ?? null }
        : {}),
    };
  }

  async create(dto: CreateAppointmentDto, clientUserId: string) {
    const today = new Date().toISOString().split('T')[0];
    if (dto.DATE < today)
      throw new BadRequestException('Date cannot be in the past');

    const barber = await this.barbersRepo.findOne({
      where: { ID: dto.BARBER_ID },
      relations: { USER: true },
    });
    if (!barber) throw new NotFoundException('Barber not found');

    const client = await this.usersRepo.findOne({
      where: { ID: clientUserId },
    });
    if (!client) throw new NotFoundException('Client not found');

    const services = await this.servicesRepo.find({
      where: { ID: In(dto.SERVICE_IDS), BARBER: { ID: dto.BARBER_ID } },
    });
    if (services.length !== dto.SERVICE_IDS.length) {
      throw new NotFoundException(
        'One or more services not found or do not belong to this barber',
      );
    }

    const conflict = await this.repo.findOne({
      where: {
        BARBER: { ID: dto.BARBER_ID },
        DATE: dto.DATE,
        TIME: dto.TIME,
        APPOINTMENT_STATUS: In([
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
        ]),
      },
    });
    if (conflict)
      throw new BadRequestException('This time slot is already booked');

    let coupon: Coupon | null = null;
    if (dto.COUPON_CODE) {
      coupon = await this.couponsService.validateForClient(
        dto.COUPON_CODE,
        dto.BARBER_ID,
        clientUserId,
      );
    }

    const appointment = await this.repo.save(
      this.repo.create({
        BARBER: barber,
        CLIENT: client,
        SERVICES: services,
        DATE: dto.DATE,
        TIME: dto.TIME,
        APPOINTMENT_STATUS: AppointmentStatus.PENDING,
        COUPON: coupon,
      }),
    );

    if (coupon) {
      await this.couponsService.registerRedemption(coupon.ID, clientUserId);
    }

    void this.notifications.send(
      barber.USER?.PUSH_TOKEN,
      'BarberApp',
      `Novo agendamento para ${dto.DATE} às ${dto.TIME}`,
      { appointmentId: appointment.ID },
    );

    return {
      id: appointment.ID,
      date: appointment.DATE,
      time: appointment.TIME,
      appointment_status: appointment.APPOINTMENT_STATUS,
      services: services.map(mapService),
      barber: {
        id: barber.ID,
        shop_name: barber.SHOP_NAME,
      },
      ...priceFields(services, coupon),
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateAppointmentStatusDto,
    requestUserId: string,
    requestUserType: UserType,
  ) {
    const entity = await this.repo.findOne({
      where: { ID: id },
      relations: {
        BARBER: { USER: true },
        CLIENT: true,
        SERVICES: true,
        COUPON: true,
      },
    });
    if (!entity) throw new NotFoundException('Appointment not found');

    const status = dto.STATUS;
    const current = entity.APPOINTMENT_STATUS;

    const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
    };

    if (!allowed[current].includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${status}`,
      );
    }

    if (status === AppointmentStatus.CANCELLED) {
      if (requestUserType === UserType.CLIENT) {
        if (entity.CLIENT?.ID !== requestUserId) {
          throw new ForbiddenException('Forbidden resource');
        }
      } else if (entity.BARBER?.USER?.ID !== requestUserId) {
        throw new ForbiddenException('Forbidden resource');
      }

      const reason = dto.CANCEL_REASON;
      if (!reason) {
        throw new BadRequestException('Cancellation reason required');
      }
      const validReasons =
        requestUserType === UserType.CLIENT
          ? CLIENT_CANCEL_REASONS
          : BARBER_CANCEL_REASONS;
      if (!validReasons.includes(reason)) {
        throw new BadRequestException(
          'Invalid cancellation reason for this role',
        );
      }

      const note = dto.CANCEL_NOTE?.trim() || null;
      if (reason === CancelReason.OTHER && !note) {
        throw new BadRequestException('Cancellation note required');
      }

      entity.CANCEL_REASON = reason;
      entity.CANCEL_NOTE = note;
      entity.CANCELLED_BY =
        requestUserType === UserType.CLIENT
          ? CancelledBy.CLIENT
          : CancelledBy.BARBER;
      entity.CANCELLED_AT = new Date();
      entity.APPOINTMENT_STATUS = status;
      await this.repo.save(entity);

      const cancelledByClient = entity.CANCELLED_BY === CancelledBy.CLIENT;
      const recipientToken = cancelledByClient
        ? entity.BARBER?.USER?.PUSH_TOKEN
        : entity.CLIENT?.PUSH_TOKEN;
      const cancellerName = cancelledByClient
        ? entity.CLIENT?.NAME
        : entity.BARBER?.SHOP_NAME;
      const reasonLabel = entity.CANCEL_REASON
        ? CANCEL_REASON_LABELS[entity.CANCEL_REASON]
        : '';

      void this.notifications.send(
        recipientToken,
        'Agendamento cancelado',
        `${cancellerName} cancelou o agendamento de ${entity.DATE} às ${entity.TIME}. Motivo: ${reasonLabel}`,
        { appointmentId: entity.ID },
      );

      return this.mapAppointment(entity, cancelledByClient);
    }

    if (status === AppointmentStatus.COMPLETED) {
      await this.completeAppointment(entity, dto.COMPLETION_CODE, requestUserId);
      return this.mapAppointment(entity, false);
    }

    if (status === AppointmentStatus.CONFIRMED && !entity.COMPLETION_CODE) {
      entity.COMPLETION_CODE = generateCompletionCode();
    }
    entity.APPOINTMENT_STATUS = status;
    await this.repo.save(entity);

    void this.notifications.send(
      entity.CLIENT?.PUSH_TOKEN,
      'BarberApp',
      'Seu agendamento foi confirmado!',
      { appointmentId: entity.ID },
    );

    return this.mapAppointment(entity, false);
  }

  /**
   * Conclusão validada por PIN (modelo escrow).
   *
   * PONTO DE INTEGRAÇÃO DE PAGAMENTO (futuro):
   * A transição bem-sucedida para COMPLETED aqui é o único lugar onde o
   * escrow do pagamento deverá ser liberado ao barbeiro. Plugar o release
   * logo antes do save final, sem alterar o restante do fluxo.
   */
  private async completeAppointment(
    entity: Appointment,
    code: string | undefined,
    requestUserId: string,
  ) {
    // Só o barbeiro dono conclui.
    if (entity.BARBER?.USER?.ID !== requestUserId) {
      throw new ForbiddenException('Forbidden resource');
    }

    if (
      entity.COMPLETION_LOCKED_UNTIL &&
      entity.COMPLETION_LOCKED_UNTIL > new Date()
    ) {
      throw new HttpException('Too many attempts', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (!code) {
      throw new BadRequestException('Completion code required');
    }

    if (code !== entity.COMPLETION_CODE) {
      entity.COMPLETION_ATTEMPTS = (entity.COMPLETION_ATTEMPTS ?? 0) + 1;
      if (entity.COMPLETION_ATTEMPTS >= MAX_COMPLETION_ATTEMPTS) {
        entity.COMPLETION_LOCKED_UNTIL = new Date(
          Date.now() + COMPLETION_LOCK_MINUTES * 60_000,
        );
        entity.COMPLETION_ATTEMPTS = 0; // zera para nova janela após o bloqueio
      }
      await this.repo.save(entity);
      throw new BadRequestException('Invalid completion code');
    }
    entity.APPOINTMENT_STATUS = AppointmentStatus.COMPLETED;
    entity.COMPLETED_AT = new Date();
    entity.COMPLETION_ATTEMPTS = 0;
    entity.COMPLETION_LOCKED_UNTIL = null;

    // 💰 HOOK DE PAGAMENTO (futuro): liberar escrow aqui.

    await this.repo.save(entity);
  }
}

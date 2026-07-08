import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User, UserType } from '../users/entities/user.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { Service } from '../services/entities/service.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CouponsService } from '../coupons/coupons.service';
import { ReviewsService } from '../reviews/reviews.service';

function mapService(s: Service) {
  return {
    id: s.ID,
    name: s.NAME,
    price: +s.PRICE,
    duration_minutes: s.DURATION_MINUTES,
  };
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
    }));
  }

  async findMine(clientUserId: string) {
    const appointments = await this.repo.find({
      where: { CLIENT: { ID: clientUserId } },
      relations: { BARBER: true, SERVICES: true, COUPON: true },
      order: { DATE: 'DESC', TIME: 'DESC' },
    });

    const reviewedIds = await this.reviewsService.reviewedAppointmentIds(
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
      reviewed: reviewedIds.has(a.ID),
      ...priceFields(a.SERVICES, a.COUPON),
    }));
  }

  async findOne(id: string) {
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
    return this.mapAppointment(appointment);
  }

  private mapAppointment(a: Appointment) {
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

  async updateStatus(id: string, status: AppointmentStatus) {
    const entity = await this.repo.findOne({
      where: { ID: id },
      relations: { BARBER: true, CLIENT: true, SERVICES: true, COUPON: true },
    });
    if (!entity) throw new NotFoundException('Appointment not found');

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

    entity.APPOINTMENT_STATUS = status;
    await this.repo.save(entity);

    if (
      status === AppointmentStatus.CONFIRMED ||
      status === AppointmentStatus.CANCELLED
    ) {
      const message =
        status === AppointmentStatus.CONFIRMED
          ? 'Seu agendamento foi confirmado!'
          : 'Seu agendamento foi cancelado.';
      void this.notifications.send(
        entity.CLIENT?.PUSH_TOKEN,
        'BarberApp',
        message,
        { appointmentId: entity.ID },
      );
    }

    return this.mapAppointment(entity);
  }
}

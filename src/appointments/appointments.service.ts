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

function mapService(s: Service) {
  return {
    id: s.ID,
    name: s.NAME,
    price: +s.PRICE,
    duration_minutes: s.DURATION_MINUTES,
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
    }));
  }

  async findMine(clientUserId: string) {
    const appointments = await this.repo.find({
      where: { CLIENT: { ID: clientUserId } },
      relations: { BARBER: true, SERVICES: true },
      order: { DATE: 'DESC', TIME: 'DESC' },
    });

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
    }));
  }

  async findOne(id: string) {
    const appointment = await this.repo.findOne({
      where: { ID: id },
      relations: { BARBER: { USER: true }, CLIENT: true, SERVICES: true },
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

    const appointment = await this.repo.save(
      this.repo.create({
        BARBER: barber,
        CLIENT: client,
        SERVICES: services,
        DATE: dto.DATE,
        TIME: dto.TIME,
        APPOINTMENT_STATUS: AppointmentStatus.PENDING,
      }),
    );

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
    };
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const entity = await this.repo.findOne({
      where: { ID: id },
      relations: { BARBER: true, CLIENT: true, SERVICES: true },
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

    if (status === AppointmentStatus.CONFIRMED || status === AppointmentStatus.CANCELLED) {
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

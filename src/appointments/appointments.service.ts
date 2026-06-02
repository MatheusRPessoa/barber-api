import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User, UserType } from '../users/entities/user.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private repo: Repository<Appointment>,
    @InjectRepository(Barber) private barbersRepo: Repository<Barber>,
    @InjectRepository(Service) private servicesRepo: Repository<Service>,
    @InjectRepository(User) private usersRepo: Repository<User>,
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
      .leftJoinAndSelect('a.SERVICE', 'service')
      .orderBy('a.TIME', 'ASC');

    if (barberId) qb.andWhere('barber.ID = :barberId', { barberId });
    if (filters.date) qb.andWhere('a.DATE = :date', { date: filters.date });
    if (filters.status) qb.andWhere('a.APPOINTMENT_STATUS = :status', { status: filters.status });

    const appointments = await qb.getMany();

    return appointments.map((a) => ({
      id: a.ID,
      date: a.DATE,
      time: a.TIME,
      appointment_status: a.APPOINTMENT_STATUS,
      client: a.CLIENT
        ? { id: a.CLIENT.ID, user: { id: a.CLIENT.ID, name: a.CLIENT.NAME, email: a.CLIENT.EMAIL } }
        : null,
      service: a.SERVICE
        ? { id: a.SERVICE.ID, name: a.SERVICE.NAME, price: a.SERVICE.PRICE, duration_minutes: a.SERVICE.DURATION_MINUTES }
        : null,
    }));
  }

  async findMine(clientUserId: string) {
    const appointments = await this.repo.find({
      where: { CLIENT: { ID: clientUserId } },
      relations: { BARBER: true, SERVICE: true },
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
      service: {
        id: a.SERVICE.ID,
        name: a.SERVICE.NAME,
        price: +a.SERVICE.PRICE,
        duration_minutes: a.SERVICE.DURATION_MINUTES,
      },
    }));
  }

  async findOne(id: string) {
    const appointment = await this.repo.findOne({
      where: { ID: id },
      relations: { BARBER: { USER: true }, CLIENT: true, SERVICE: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async create(dto: CreateAppointmentDto, clientUserId: string) {
    const today = new Date().toISOString().split('T')[0];
    if (dto.DATE < today) throw new BadRequestException('Date cannot be in the past');

    const barber = await this.barbersRepo.findOne({ where: { ID: dto.BARBER_ID } });
    if (!barber) throw new NotFoundException('Barber not found');

    const client = await this.usersRepo.findOne({ where: { ID: clientUserId } });
    if (!client) throw new NotFoundException('Client not found');

    const service = await this.servicesRepo.findOne({
      where: { ID: dto.SERVICE_ID, BARBER: { ID: dto.BARBER_ID } },
    });
    if (!service) throw new NotFoundException('Service not found');

    const conflict = await this.repo.findOne({
      where: {
        BARBER: { ID: dto.BARBER_ID },
        DATE: dto.DATE,
        TIME: dto.TIME,
        APPOINTMENT_STATUS: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });
    if (conflict) throw new BadRequestException('This time slot is already booked');

    const appointment = await this.repo.save(
      this.repo.create({
        BARBER: barber,
        CLIENT: client,
        SERVICE: service,
        DATE: dto.DATE,
        TIME: dto.TIME,
        APPOINTMENT_STATUS: AppointmentStatus.PENDING,
      }),
    );

    return {
      id: appointment.ID,
      date: appointment.DATE,
      time: appointment.TIME,
      appointment_status: appointment.APPOINTMENT_STATUS,
      service: {
        id: service.ID,
        name: service.NAME,
        price: +service.PRICE,
        duration_minutes: service.DURATION_MINUTES,
      },
      barber: {
        id: barber.ID,
        shop_name: barber.SHOP_NAME,
      },
    };
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.findOne(id);
    const current = appointment.APPOINTMENT_STATUS;

    const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]:   [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.CONFIRMED]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
    };

    if (!allowed[current].includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${status}`,
      );
    }

    appointment.APPOINTMENT_STATUS = status;
    return this.repo.save(appointment);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from '../users/entities/user.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private repo: Repository<Appointment>,
    @InjectRepository(Barber) private barbersRepo: Repository<Barber>,
    @InjectRepository(Service) private servicesRepo: Repository<Service>,
  ) {}

  findAll(filters: { barberId?: string; date?: string; status?: AppointmentStatus }) {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.BARBER', 'barber')
      .leftJoinAndSelect('barber.USER', 'barberUser')
      .leftJoinAndSelect('a.CLIENT', 'client')
      .leftJoinAndSelect('a.SERVICE', 'service')
      .orderBy('a.DATE', 'ASC')
      .addOrderBy('a.TIME', 'ASC');

    if (filters.barberId) qb.andWhere('barber.ID = :barberId', { barberId: filters.barberId });
    if (filters.date) qb.andWhere('a.DATE = :date', { date: filters.date });
    if (filters.status) qb.andWhere('a.APPOINTMENT_STATUS = :status', { status: filters.status });

    return qb.getMany();
  }

  async findOne(id: string) {
    const appointment = await this.repo.findOne({
      where: { ID: id },
      relations: { BARBER: { USER: true }, CLIENT: true, SERVICE: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async create(dto: CreateAppointmentDto, client: User) {
    const barber = await this.barbersRepo.findOne({ where: { ID: dto.BARBER_ID } });
    if (!barber) throw new NotFoundException('Barber not found');

    const service = await this.servicesRepo.findOne({ where: { ID: dto.SERVICE_ID } });
    if (!service) throw new NotFoundException('Service not found');

    return this.repo.save(
      this.repo.create({
        BARBER: barber,
        CLIENT: client,
        SERVICE: service,
        DATE: dto.DATE,
        TIME: dto.TIME,
        APPOINTMENT_STATUS: AppointmentStatus.UPCOMING,
      }),
    );
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.findOne(id);
    appointment.APPOINTMENT_STATUS = status;
    return this.repo.save(appointment);
  }
}

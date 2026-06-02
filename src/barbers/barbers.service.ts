import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Barber } from './entities/barber.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { UsersService } from '../users/users.service';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { Service } from '../services/entities/service.entity';

function mapService(s: Service) {
  return {
    id: s.ID,
    name: s.NAME,
    price: +s.PRICE,
    duration_minutes: s.DURATION_MINUTES,
  };
}

function generateSlots(): string[] {
  const slots: string[] = [];
  let h = 9,
    m = 0;
  while (h < 19) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) {
      h++;
      m -= 60;
    }
  }
  return slots;
}

@Injectable()
export class BarbersService {
  constructor(
    @InjectRepository(Barber) private repo: Repository<Barber>,
    @InjectRepository(Appointment)
    private appointmentsRepo: Repository<Appointment>,
    private usersService: UsersService,
  ) {}

  findByUserId(userId: string) {
    return this.repo.findOne({
      where: { USER: { ID: userId } },
      relations: { USER: true },
    });
  }

  async findAll() {
    const barbers = await this.repo.find({
      relations: { SERVICES: true },
      order: { RATING: 'DESC' },
    });

    return barbers.map((b) => ({
      id: b.ID,
      shop_name: b.SHOP_NAME,
      rating: b.RATING,
      street: b.STREET,
      city: b.CITY,
      state: b.STATE,
      services: b.SERVICES.map(mapService),
    }));
  }

  async findServicesById(barberId: string) {
    const barber = await this.repo.findOne({
      where: { ID: barberId },
      relations: { SERVICES: true },
    });
    if (!barber) throw new NotFoundException('Barber not found');
    return barber.SERVICES.map(mapService);
  }

  async getAvailableSlots(barberId: string, date: string) {
    const barberExists = await this.repo.findOne({ where: { ID: barberId } });
    if (!barberExists) throw new NotFoundException('Barber not found');

    let slots = generateSlots();

    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      slots = slots.filter((slot) => {
        const [h, m] = slot.split(':').map(Number);
        return h * 60 + m > nowMinutes;
      });
    }

    const booked = await this.appointmentsRepo.find({
      where: {
        BARBER: { ID: barberId },
        DATE: date,
        APPOINTMENT_STATUS: In([
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
        ]),
      },
      select: { TIME: true },
    });
    const bookedTimes = new Set(booked.map((a) => a.TIME));

    return {
      date,
      available: slots.filter((slot) => !bookedTimes.has(slot)),
    };
  }

  async update(userId: string, dto: UpdateBarberDto) {
    const { NAME, ...barberFields } = dto;

    if (NAME) {
      await this.usersService.updateName(userId, NAME);
    }

    if (Object.keys(barberFields).length > 0) {
      const result = await this.repo.update(
        { USER: { ID: userId } },
        barberFields,
      );
      if (result.affected === 0)
        throw new NotFoundException('Barber profile not found');
    }

    const barber = await this.repo.findOne({ where: { USER: { ID: userId } } });

    return {
      id: barber!.ID,
      shop_name: barber!.SHOP_NAME,
      cnpj: barber!.CNPJ,
      street: barber!.STREET,
      number: barber!.NUMBER,
      complement: barber!.COMPLEMENT ?? null,
      neighborhood: barber!.NEIGHBORHOOD,
      city: barber!.CITY,
      state: barber!.STATE,
      zip_code: barber!.ZIP_CODE,
    };
  }
}

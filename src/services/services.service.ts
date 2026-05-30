import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { Barber } from '../barbers/entities/barber.entity';

@Injectable()
export class ServicesService {
  constructor(@InjectRepository(Service) private repo: Repository<Service>) {}

  findByBarber(barberId: string) {
    return this.repo.find({ where: { BARBER: { ID: barberId } } });
  }

  create(dto: CreateServiceDto, barber: Barber) {
    const service = this.repo.create({
      NAME: dto.NAME,
      PRICE: dto.PRICE,
      DURATION_MINUTES: dto.DURATION_MINUTES,
      BARBER: barber,
    });
    return this.repo.save(service);
  }
}

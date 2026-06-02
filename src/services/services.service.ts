import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

function mapService(s: Service) {
  return {
    id: s.ID,
    name: s.NAME,
    price: +s.PRICE,
    duration_minutes: s.DURATION_MINUTES,
  };
}

@Injectable()
export class ServicesService {
  constructor(@InjectRepository(Service) private repo: Repository<Service>) {}

  async findByBarber(barberId: string) {
    const services = await this.repo.find({ where: { BARBER: { ID: barberId } } });
    return services.map(mapService);
  }

  async findByBarberUserId(userId: string) {
    const services = await this.repo.find({ where: { BARBER: { USER: { ID: userId } } } });
    return services.map(mapService);
  }

  async create(dto: CreateServiceDto, barber: Barber) {
    const service = this.repo.create({
      NAME: dto.NAME,
      PRICE: dto.PRICE,
      DURATION_MINUTES: dto.DURATION_MINUTES,
      BARBER: barber,
    });
    return mapService(await this.repo.save(service));
  }

  async update(id: string, barberId: string, dto: UpdateServiceDto) {
    const service = await this.repo.findOne({ where: { ID: id, BARBER: { ID: barberId } } });
    if (!service) throw new ForbiddenException('Service not found or access denied');
    Object.assign(service, dto);
    return mapService(await this.repo.save(service));
  }

  async remove(id: string, barberId: string) {
    const service = await this.repo.findOne({ where: { ID: id, BARBER: { ID: barberId } } });
    if (!service) throw new ForbiddenException('Service not found or access denied');
    await this.repo.remove(service);
  }
}

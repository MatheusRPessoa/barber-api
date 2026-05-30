import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barber } from './entities/barber.entity';

@Injectable()
export class BarbersService {
  constructor(@InjectRepository(Barber) private repo: Repository<Barber>) {}

  findByUserId(userId: string) {
    return this.repo.findOne({ where: { USER: { ID: userId } }, relations: { USER: true } });
  }
}

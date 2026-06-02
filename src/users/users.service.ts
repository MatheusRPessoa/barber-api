import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { ID: id },
      select: { ID: true, NAME: true, EMAIL: true, TYPE: true, CRIADO_EM: true },
    });
  }

  updateName(id: string, name: string) {
    return this.repo.update(id, { NAME: name });
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { UsersService } from '../users/users.service';
import { UpdateClientDto } from './dto/update-client.dto';

function mapClient(client: Client) {
  return {
    id: client.ID,
    cpf: client.CPF,
    street: client.STREET,
    number: client.NUMBER,
    complement: client.COMPLEMENT ?? null,
    neighborhood: client.NEIGHBORHOOD,
    city: client.CITY,
    state: client.STATE,
    zip_code: client.ZIP_CODE,
  };
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private repo: Repository<Client>,
    private usersService: UsersService,
  ) {}

  findByUserId(userId: string) {
    return this.repo.findOne({
      where: { USER: { ID: userId } },
      relations: { USER: true },
    });
  }

  async getFavoriteIds(userId: string): Promise<Set<string>> {
    const client = await this.repo.findOne({
      where: { USER: { ID: userId } },
      relations: { FAVORITES: true },
    });
    return new Set((client?.FAVORITES ?? []).map((b) => b.ID));
  }

  async getMe(userId: string) {
    const client = await this.findByUserId(userId);
    if (!client) throw new NotFoundException('Client profile not found');

    return {
      ...mapClient(client),
      name: client.USER.NAME,
      email: client.USER.EMAIL,
    };
  }

  async update(userId: string, dto: UpdateClientDto) {
    const { NAME, ...clientFields } = dto;

    if (NAME) {
      await this.usersService.updateName(userId, NAME);
    }

    if (clientFields.CPF) {
      const existingCpf = await this.repo.findOne({
        where: { CPF: clientFields.CPF, USER: { ID: Not(userId) } },
      });
      if (existingCpf) throw new ConflictException('CPF already in use');
    }

    if (Object.keys(clientFields).length > 0) {
      const result = await this.repo.update(
        { USER: { ID: userId } },
        clientFields,
      );
      if (result.affected === 0)
        throw new NotFoundException('Client profile not found');
    }

    const client = await this.repo.findOne({ where: { USER: { ID: userId } } });

    return mapClient(client!);
  }
}

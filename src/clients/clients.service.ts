import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Barber } from '../barbers/entities/barber.entity';
import { mapBarberListItem, withDistance } from '../barbers/barbers.service';
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
    @InjectRepository(Barber) private barbersRepo: Repository<Barber>,
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

  private async findWithFavorites(userId: string) {
    const client = await this.repo.findOne({
      where: { USER: { ID: userId } },
      relations: { FAVORITES: true },
    });
    if (!client) throw new NotFoundException('Client profile not found');
    return client;
  }

  async addFavorite(userId: string, barberId: string) {
    const client = await this.findWithFavorites(userId);

    const barber = await this.barbersRepo.findOne({ where: { ID: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');

    if (client.FAVORITES.some((b) => b.ID === barberId)) return;

    client.FAVORITES.push(barber);
    await this.repo.save(client);
  }

  async removeFavorite(userId: string, barberId: string) {
    const client = await this.findWithFavorites(userId);

    const remaining = client.FAVORITES.filter((b) => b.ID !== barberId);
    if (remaining.length === client.FAVORITES.length) return;

    client.FAVORITES = remaining;
    await this.repo.save(client);
  }

  async listFavorites(userId: string, lat?: number, lng?: number) {
    const client = await this.repo.findOne({
      where: { USER: { ID: userId } },
      relations: { FAVORITES: { SERVICES: true } },
    });
    if (!client) throw new NotFoundException('Client profile not found');

    const items = client.FAVORITES.map((b) => {
      const item: Record<string, unknown> = withDistance(
        mapBarberListItem(b),
        b,
        lat,
        lng,
      );
      item.is_favorite = true;
      return item;
    });

    items.sort(
      (a, b) =>
        ((b.rating as number | null) ?? -1) -
        ((a.rating as number | null) ?? -1),
    );

    return items;
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

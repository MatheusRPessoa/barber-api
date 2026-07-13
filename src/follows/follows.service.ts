import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Follow } from "./entities/follow.entity";
import { Repository } from "typeorm";
import { Barber } from "../barbers/entities/barber.entity";

@Injectable()
export class FollowsService {
    constructor(
        @InjectRepository(Follow) private follows: Repository<Follow>,
        @InjectRepository(Barber) private barbers: Repository<Barber>,
    ) {}

    async follow(userId: string, barberId: string) {
        const barber = await this.barbers.findOne({ where: { ID: barberId } });
        if (!barber) throw new NotFoundException('Barber not found');

        const existing = await this.follows.findOne({
            where: { USER: { ID: userId }, BARBER: { ID: barberId } },
        });
        if (existing) return;

        await this.follows.save(
            this.follows.create({ USER: { ID: userId }, BARBER: { ID: barberId } }),
        );
    }

    async unfollow(userId: string, barberId: string) {
        const existing = await this.follows.findOne({
            where: { USER: { ID: userId }, BARBER: { ID: barberId } },
        });
        if (existing) await this.follows.remove(existing);
    }

    async followersCount(barberId: string): Promise<number> {
        const barber = await this.barbers.findOne({ where: { ID: barberId } });
        if (!barber) throw new NotFoundException('Barber not found');
        return this.follows.count({ where: { BARBER: { ID: barberId } } });
    }

    async getFollowingIds(userId: string): Promise<Set<string>> {
        const rows = await this.follows.find({
            where: { USER: { ID: userId } },
            relations: { BARBER: true },
        });
        return new Set(rows.map((f) => f.BARBER.ID));
    }

    async followersCountByBarberIds(
        barberIds: string[],
    ): Promise<Map<string, number>> {
        if (barberIds.length === 0) return new Map();
        const rows = await this.follows
            .createQueryBuilder('f')
            .leftJoin('f.BARBER', 'b')
            .select('b.ID', 'barber_id')
            .addSelect('COUNT(*)', 'count')
            .where('b.ID IN (:...ids)', { ids: barberIds })
            .groupBy('b.ID')
            .getRawMany<{ barber_id: string; count: string }>();
        return new Map(rows.map((r) => [r.barber_id, +r.count]));
    }
}
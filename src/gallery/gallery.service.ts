import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GalleryPost } from "./entities/gallery-post.entity";
import { In, Repository } from "typeorm";
import { GalleryLike } from "./entities/gallery-like.entity";
import { Barber } from "../barbers/entities/barber.entity";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class GalleryService {
    constructor (
        @InjectRepository(GalleryPost) private posts: Repository<GalleryPost>,
        @InjectRepository(GalleryLike) private likes: Repository<GalleryLike>,
        @InjectRepository(Barber) private barbers: Repository<Barber>,
        private storage: StorageService,
    ) {}

    async create(userId: string, file: Express.Multer.File, caption?: string) {
        const barber = await this.barbers.findOne({ where: { USER: { ID: userId } } });
        if (!barber) throw new NotFoundException('Barber profile not found');

        const key = await this.storage.save(file);
        const post = await this.posts.save(
            this.posts.create({
                BARBER: barber,
                IMAGE_KEY: key,
                CAPTION: caption?.trim() || null,
            }),
        );
        return this.mapPost(post, 0, false)
    }

    async remove(userId: string, postId: string) {
        const post = await this.posts.findOne({
            where: { ID: postId },
            relations: { BARBER: { USER: true } },
        });
        if (!post) throw new NotFoundException('Gallery post not found');
        if (post.BARBER?.USER?.ID !== userId)
            throw new ForbiddenException('Forbidden resource');

        await this.posts.remove(post);
        await this.storage.delete(post.IMAGE_KEY);
    }

    async listByBarber(barberId: string, clientUserId?: string) {
        const barber = await this.barbers.findOne({ where: { ID: barberId } });
        if (!barber) throw new NotFoundException('Barber not found');

        const posts = await this.posts.find({
            where: { BARBER: { ID: barberId } },
            order: { CRIADO_EM: 'DESC' },
        });
        if (posts.length === 0) return [];

        const ids = posts.map((p) => p.ID);

        const countRows = await this.likes
            .createQueryBuilder('l')
            .leftJoin('l.POST', 'p')
            .select('p.ID', 'post_id')
            .addSelect('COUNT(*)', 'count')
            .where('p.ID IN (:...ids)', { ids })
            .groupBy('p.ID')
            .getRawMany<{ post_id: string; count: string }>();
        const counts = new Map(countRows.map((r) => [r.post_id, +r.count]));

        let likedIds = new Set<string>();
        if (clientUserId) {
            const liked = await this.likes.find({
                where: { USER: { ID: clientUserId }, POST: { ID: In(ids) } },
                relations: { POST: true },
            });
            likedIds = new Set(liked.map((l) => l.POST.ID));
        }

        return posts.map((p) => 
            this.mapPost(
                p,
                counts.get(p.ID) ?? 0,
                clientUserId ? likedIds.has(p.ID) : undefined,
            ),
        );
    }

    async like(clientUserId: string, postId: string) {
        const post = await this.posts.findOne({ where: { ID: postId } });
        if (!post) throw new NotFoundException('Gallery post not found');

        const existing = await this.likes.findOne({
            where: { USER: { ID: clientUserId }, POST: { ID: postId } },
        });
        if (existing) return;

        await this.likes.save(
            this.likes.create({ USER: { ID: clientUserId }, POST: { ID: postId } }),
        );
    }

    async unlike(clientUserId: string, postId: string) {
        const post = await this.posts.findOne({ where: { ID: postId } });
        if (!post) throw new NotFoundException('Gallery post not found');

        const existing = await this.likes.findOne({
            where: { USER: { ID: clientUserId }, POST: { ID: postId } },
        });
        if (existing) await this.likes.remove(existing);
    }

    private mapPost(p: GalleryPost, likeCount: number, isLiked?: boolean) {
        return {
            id: p.ID,
            image_url: this.storage.urlFor(p.IMAGE_KEY),
            caption:p.CAPTION ?? null,
            likes_count: likeCount,
            created_at: p.CRIADO_EM,
            ...(isLiked === undefined ? {} : { is_liked: isLiked })
        }
    }
}
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Barber } from '../../barbers/entities/barber.entity';
import { GalleryLike } from './gallery-like.entity';

@Entity('gallery_posts')
export class GalleryPost extends BaseEntity {
    @ManyToOne(() => Barber, { onDelete: 'CASCADE' })
    BARBER: Barber;

    @Column({ type: 'varchar' })
    IMAGE_KEY: string;

    @Column({ type: 'varchar', length: 300, nullable: true, default: null })
    CAPTION: string | null;

    @OneToMany(() => GalleryLike, (like) => like.POST)
    LIKES: GalleryLike[];
}
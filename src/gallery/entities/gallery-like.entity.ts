import { Entity, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { GalleryPost } from './gallery-post.entity';

@Entity('gallery_likes')
@Unique(['USER', 'POST']) // idempotência: 1 curtida por (cliente, foto)
export class GalleryLike extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  USER: User;

  @ManyToOne(() => GalleryPost, (post) => post.LIKES, { onDelete: 'CASCADE' })
  POST: GalleryPost;
}

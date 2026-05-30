import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('barbers')
export class Barber extends BaseEntity {
  @Column()
  SHOP_NAME: string;

  @Column({ nullable: true })
  CNPJ: string | null;

  @Column({ type: 'float', default: 0 })
  RATING: number;

  @OneToOne(() => User)
  @JoinColumn()
  USER: User;
}

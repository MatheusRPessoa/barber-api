import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Barber } from '../../barbers/entities/barber.entity';

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column()
  CODE: string;

  @Column({ type: 'int' })
  DISCOUNT_PERCENT: number;

  @Column({ type: 'date' })
  VALID_UNTIL: string;

  @Column({ default: true })
  ACTIVE: boolean;

  @ManyToOne(() => Barber)
  BARBER: Barber;
}

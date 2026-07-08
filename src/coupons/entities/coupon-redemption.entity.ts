import { Entity, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Coupon } from './coupon.entity';
import { User } from '../../users/entities/user.entity';

@Entity('coupon_redemptions')
@Unique(['COUPON', 'CLIENT'])
export class CouponRedemption extends BaseEntity {
  @ManyToOne(() => Coupon)
  COUPON: Coupon;

  @ManyToOne(() => User)
  CLIENT: User;
}

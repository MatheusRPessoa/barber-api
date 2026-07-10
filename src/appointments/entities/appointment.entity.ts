import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Barber } from '../../barbers/entities/barber.entity';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';
import {
  AppointmentStatus,
  CancelledBy,
  CancelReason,
} from '../enums/appointment-status.enum';

@Entity('appointments')
export class Appointment extends BaseEntity {
  @ManyToOne(() => Barber)
  BARBER: Barber;

  @ManyToOne(() => User)
  CLIENT: User;

  @ManyToMany(() => Service)
  @JoinTable()
  SERVICES: Service[];

  @Column()
  DATE: string;

  @Column()
  TIME: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  APPOINTMENT_STATUS: AppointmentStatus;

  @ManyToOne(() => Coupon, { nullable: true })
  COUPON: Coupon | null;

  @Column({ type: 'enum', enum: CancelReason, nullable: true, default: null })
  CANCEL_REASON: CancelReason | null;

  @Column({ type: 'varchar', length: 300, nullable: true, default: null })
  CANCEL_NOTE: string | null;

  @Column({ type: 'enum', enum: CancelledBy, nullable: true, default: null })
  CANCELLED_BY: CancelledBy | null;

  @Column({ type: 'varchar', length: 4, nullable: true, default: null })
  COMPLETION_CODE: string | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  CANCELLED_AT: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  COMPLETED_AT: Date | null;

  @Column({ type: 'int', default: 0 })
  COMPLETION_ATTEMPTS: number;

  @Column({ type: 'timestamp', nullable: true, default: null })
  COMPLETION_LOCKED_UNTIL: Date | null;
}

import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Barber } from '../../barbers/entities/barber.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
export class Review extends BaseEntity {
  @Column({ type: 'int' })
  RATING: number;

  @Column({ type: 'varchar', nullable: true })
  COMMENT: string | null;

  @OneToOne(() => Appointment)
  @JoinColumn()
  APPOINTMENT: Appointment;

  @ManyToOne(() => User)
  CLIENT: User;

  @ManyToOne(() => Barber)
  BARBER: Barber;
}

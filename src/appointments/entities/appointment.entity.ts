import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Barber } from '../../barbers/entities/barber.entity';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';

export enum AppointmentStatus {
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('appointments')
export class Appointment extends BaseEntity {
  @ManyToOne(() => Barber)
  BARBER: Barber;

  @ManyToOne(() => User)
  CLIENT: User;

  @ManyToOne(() => Service)
  SERVICE: Service;

  @Column()
  DATE: string;

  @Column()
  TIME: string;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.UPCOMING })
  APPOINTMENT_STATUS: AppointmentStatus;
}

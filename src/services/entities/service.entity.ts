import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Barber } from '../../barbers/entities/barber.entity';

@Entity('services')
export class Service extends BaseEntity {
  @Column()
  NAME: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  PRICE: number;

  @Column()
  DURATION_MINUTES: number;

  @ManyToOne(() => Barber, (barber) => barber.SERVICES, { onDelete: 'CASCADE' })
  BARBER: Barber;
}

import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Barber } from '../../barbers/entities/barber.entity';

@Entity('clients')
export class Client extends BaseEntity {
  @Column({ unique: true })
  CPF: string;

  @Column({ type: 'varchar' })
  STREET: string;

  @Column({ type: 'varchar' })
  NUMBER: string;

  @Column({ type: 'varchar', nullable: true })
  COMPLEMENT?: string;

  @Column({ type: 'varchar' })
  NEIGHBORHOOD: string;

  @Column({ type: 'varchar' })
  CITY: string;

  @Column({ type: 'varchar', length: 2 })
  STATE: string;

  @Column({ type: 'varchar', length: 9 })
  ZIP_CODE: string;

  @ManyToMany(() => Barber)
  @JoinTable({ name: 'client_favorites' })
  FAVORITES: Barber[];

  @OneToOne(() => User)
  @JoinColumn()
  USER: User;
}

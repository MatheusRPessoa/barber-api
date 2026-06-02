import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';

@Entity('barbers')
export class Barber extends BaseEntity {
  @Column()
  SHOP_NAME: string;

  @Column({ unique: true })
  CNPJ: string;

  @Column({ type: 'float', default: 0 })
  RATING: number;

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

  @OneToMany(() => Service, (service) => service.BARBER)
  SERVICES: Service[];

  @OneToOne(() => User)
  @JoinColumn()
  USER: User;
}

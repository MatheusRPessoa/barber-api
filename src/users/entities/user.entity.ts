import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum UserType {
  CLIENT = 'CLIENT',
  BARBER = 'BARBER',
}

@Entity('users')
export class User extends BaseEntity {
  @Column()
  NAME: string;

  @Column({ unique: true })
  EMAIL: string;

  @Column()
  PASSWORD: string;

  @Column({ type: 'enum', enum: UserType })
  TYPE: UserType;

  @Column({ nullable: true })
  REFRESH_TOKEN: string | null;

  @Column({ nullable: true })
  PASSWORD_RESET_TOKEN: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  PASSWORD_RESET_EXPIRES: Date | null;
}

import { Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityStatusEnum } from '../enums/base-entity-status.enum';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  ID: string;

  @Column({ nullable: true })
  CRIADO_POR: string | null;

  @CreateDateColumn()
  CRIADO_EM: Date;

  @Column({ type: 'enum', enum: BaseEntityStatusEnum, default: BaseEntityStatusEnum.ATIVO })
  STATUS: BaseEntityStatusEnum;

  @Column({ nullable: true })
  ATUALIZADO_POR: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  ATUALIZADO_EM: Date | null;

  @Column({ nullable: true })
  EXCLUIDO_POR: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  EXCLUIDO_EM: Date | null;
}

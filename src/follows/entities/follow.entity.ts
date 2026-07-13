import { Entity, ManyToOne, Unique } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { User } from "../../users/entities/user.entity";
import { Barber } from "../../barbers/entities/barber.entity";

@Entity('follows')
@Unique(['USER', 'BARBER'])
export class Follow extends BaseEntity {
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    USER: User;

    @ManyToOne(() => Barber, { onDelete: 'CASCADE' })
    BARBER: Barber;
}
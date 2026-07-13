import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Follow } from "./entities/follow.entity";
import { Barber } from "../barbers/entities/barber.entity";
import { FollowsController } from "./follows.controller";
import { FollowsService } from "./follows.service";

@Module({
    imports: [TypeOrmModule.forFeature([Follow, Barber])],
    controllers: [FollowsController],
    providers: [FollowsService],
    exports: [FollowsService],
})
export class FollowsModule {}
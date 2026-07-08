import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarbersService } from './barbers.service';
import { BarbersController } from './barbers.controller';
import { Barber } from './entities/barber.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UsersModule } from '../users/users.module';
import { ClientsModule } from '../clients/clients.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Barber, Appointment]),
    UsersModule,
    ClientsModule,
    ReviewsModule,
  ],
  controllers: [BarbersController],
  providers: [BarbersService],
  exports: [BarbersService],
})
export class BarbersModule {}

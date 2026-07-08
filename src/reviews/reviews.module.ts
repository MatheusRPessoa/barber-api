import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Barber } from '../barbers/entities/barber.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Appointment, Barber])],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

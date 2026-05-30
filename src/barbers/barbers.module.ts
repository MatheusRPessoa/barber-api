import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarbersService } from './barbers.service';
import { Barber } from './entities/barber.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Barber])],
  providers: [BarbersService],
  exports: [BarbersService],
})
export class BarbersModule {}

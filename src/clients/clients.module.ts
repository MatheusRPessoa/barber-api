import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.entity';
import { UsersModule } from '../users/users.module';
import { Barber } from '../barbers/entities/barber.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Barber]), UsersModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}

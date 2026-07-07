import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { BarbersModule } from '../barbers/barbers.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon]), BarbersModule, AuthModule],
  controllers: [CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BarbersModule } from './barbers/barbers.module';
import { ServicesModule } from './services/services.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { User } from './users/entities/user.entity';
import { Barber } from './barbers/entities/barber.entity';
import { Service } from './services/entities/service.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { Client } from './clients/entities/client.entity';
import { ClientsModule } from './clients/clients.module';
import { Coupon } from './coupons/entities/coupon.entity';
import { CouponsModule } from './coupons/coupons.module';
import { Review } from './reviews/entities/review.entity';
import { CouponRedemption } from './coupons/entities/coupon-redemption.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'HH:MM:ss',
                  },
                },
            serializers: {
              req: (req: { id: string; method: string; url: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: { statusCode: number }) => ({
                statusCode: res.statusCode,
              }),
            },
            autoLogging: {
              ignore: (req: { url?: string }) => req.url === '/health',
            },
            customProps: () => ({ context: 'HTTP' }),
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [
          User,
          Barber,
          Client,
          Service,
          Appointment,
          Coupon,
          Review,
          CouponRedemption,
        ],
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    BarbersModule,
    ServicesModule,
    AppointmentsModule,
    CouponsModule,
  ],
})
export class AppModule {}

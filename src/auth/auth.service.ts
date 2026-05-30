import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserType } from '../users/entities/user.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Barber) private barbersRepo: Repository<Barber>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private signTokens(payload: JwtPayload) {
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
    return { access_token, refresh_token };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { EMAIL: dto.EMAIL } });
    if (existing) throw new ConflictException('Email already in use');

    const user = this.usersRepo.create({
      NAME: dto.NAME,
      EMAIL: dto.EMAIL,
      PASSWORD: await bcrypt.hash(dto.PASSWORD, 10),
      TYPE: dto.TYPE,
    });
    await this.usersRepo.save(user);

    if (dto.TYPE === UserType.BARBER) {
      await this.barbersRepo.save(
        this.barbersRepo.create({ SHOP_NAME: dto.SHOP_NAME ?? dto.NAME, USER: user }),
      );
    }

    const tokens = this.signTokens({ sub: user.ID, email: user.EMAIL, type: user.TYPE });
    await this.usersRepo.update(user.ID, { REFRESH_TOKEN: await bcrypt.hash(tokens.refresh_token, 10) });

    return tokens;
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { EMAIL: dto.EMAIL } });
    if (!user || !(await bcrypt.compare(dto.PASSWORD, user.PASSWORD))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.signTokens({ sub: user.ID, email: user.EMAIL, type: user.TYPE });
    await this.usersRepo.update(user.ID, { REFRESH_TOKEN: await bcrypt.hash(tokens.refresh_token, 10) });

    return {
      ...tokens,
      user: { id: user.ID, name: user.NAME, email: user.EMAIL, type: user.TYPE },
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersRepo.findOne({ where: { ID: userId } });
    if (!user?.REFRESH_TOKEN) throw new UnauthorizedException('Access denied');

    const valid = await bcrypt.compare(refreshToken, user.REFRESH_TOKEN);
    if (!valid) throw new UnauthorizedException('Access denied');

    const tokens = this.signTokens({ sub: user.ID, email: user.EMAIL, type: user.TYPE });
    await this.usersRepo.update(user.ID, { REFRESH_TOKEN: await bcrypt.hash(tokens.refresh_token, 10) });

    return tokens;
  }

  async logout(userId: string) {
    await this.usersRepo.update(userId, { REFRESH_TOKEN: null });
    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    return this.usersRepo.findOne({
      where: { ID: userId },
      select: { ID: true, NAME: true, EMAIL: true, TYPE: true, CRIADO_EM: true },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepo.findOne({ where: { EMAIL: email } });
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    await this.usersRepo.update(user.ID, {
      PASSWORD_RESET_TOKEN: await bcrypt.hash(token, 10),
      PASSWORD_RESET_EXPIRES: expires,
    });

    const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}&id=${user.ID}`;
    // TODO: replace with MailService when SMTP is configured
    console.log(`[ForgotPassword] Reset URL: ${resetUrl}`);
  }

  async resetPassword(dto: { USER_ID: string; TOKEN: string; NEW_PASSWORD: string }) {
    const user = await this.usersRepo.findOne({ where: { ID: dto.USER_ID } });

    if (!user?.PASSWORD_RESET_TOKEN || !user.PASSWORD_RESET_EXPIRES) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.PASSWORD_RESET_EXPIRES < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const valid = await bcrypt.compare(dto.TOKEN, user.PASSWORD_RESET_TOKEN);
    if (!valid) throw new BadRequestException('Invalid or expired reset token');

    await this.usersRepo.update(user.ID, {
      PASSWORD: await bcrypt.hash(dto.NEW_PASSWORD, 10),
      PASSWORD_RESET_TOKEN: null,
      PASSWORD_RESET_EXPIRES: null,
    });
  }
}

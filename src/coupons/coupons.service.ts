import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { BarbersService } from '../barbers/barbers.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

const MS_PER_DAY = 86_400_000;

function mapCoupon(c: Coupon) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(c.VALID_UNTIL).getTime() - Date.now()) / MS_PER_DAY),
  );
  return {
    id: c.ID,
    code: c.CODE,
    discount_percent: c.DISCOUNT_PERCENT,
    valid_until: c.VALID_UNTIL,
    days_left: daysLeft,
    barber: { id: c.BARBER.ID, shop_name: c.BARBER.SHOP_NAME },
  };
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private repo: Repository<Coupon>,
    private barbersService: BarbersService,
  ) {}

  private today() {
    return new Date().toISOString().split('T')[0];
  }

  async findAllPublic() {
    const coupons = await this.repo.find({
      where: { ACTIVE: true, VALID_UNTIL: MoreThanOrEqual(this.today()) },
      relations: { BARBER: true },
      order: { VALID_UNTIL: 'ASC' },
    });
    return coupons.map(mapCoupon);
  }

  private async getOwnBarber(userId: string) {
    const barber = await this.barbersService.findByUserId(userId);
    if (!barber) throw new NotFoundException('Barber profile not found');
    return barber;
  }

  private async getOwnedCoupon(userId: string, couponId: string) {
    const coupon = await this.repo.findOne({
      where: { ID: couponId },
      relations: { BARBER: { USER: true } },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (coupon.BARBER.USER.ID !== userId)
      throw new ForbiddenException('Coupon belongs to another barber');
    return coupon;
  }

  async create(userId: string, dto: CreateCouponDto) {
    const barber = await this.getOwnBarber(userId);

    if (dto.VALID_UNTIL < this.today())
      throw new BadRequestException('VALID_UNTIL must not be in the past');

    const duplicate = await this.repo.findOne({
      where: { CODE: dto.CODE, BARBER: { ID: barber.ID } },
    });
    if (duplicate) throw new ConflictException('Coupon code already in use');

    const coupon = await this.repo.save(
      this.repo.create({
        CODE: dto.CODE,
        DISCOUNT_PERCENT: dto.DISCOUNT_PERCENT,
        VALID_UNTIL: dto.VALID_UNTIL,
        BARBER: barber,
      }),
    );
    return mapCoupon(coupon);
  }

  async update(userId: string, couponId: string, dto: UpdateCouponDto) {
    const coupon = await this.getOwnedCoupon(userId, couponId);

    if (dto.CODE && dto.CODE !== coupon.CODE) {
      const duplicate = await this.repo.findOne({
        where: {
          CODE: dto.CODE,
          BARBER: { ID: coupon.BARBER.ID },
          ID: Not(couponId),
        },
      });
      if (duplicate) throw new ConflictException('Coupon code already in use');
    }

    this.repo.merge(coupon, dto);
    await this.repo.save(coupon);
    return mapCoupon(coupon);
  }

  async remove(userId: string, couponId: string) {
    const coupon = await this.getOwnedCoupon(userId, couponId);
    await this.repo.remove(coupon);
  }
}

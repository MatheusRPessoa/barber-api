import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '../users/entities/user.entity';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { ValidateCouponQueryDto } from './dto/validate-coupon-query.dto';

@ApiTags('Cupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar ofertas ativas',
    description:
      'Retorna cupons ativos e não expirados, ordenados pela validade mais próxima. Público, sem autenticação',
  })
  findAll() {
    return this.couponsService.findAllPublic();
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Validar cupom antes de confirmar agendamento',
    description:
      'Cupom deve existir, estar ativo, não expirado e pertencer à barbearia. Uso único por cliente: se já usado → 409',
  })
  validate(
    @Request() req: AuthenticatedRequest,
    @Query() query: ValidateCouponQueryDto,
  ) {
    return this.couponsService.validate(
      query.code,
      query.barberId,
      req.user.sub,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BARBER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar cupom (barbeiro)' })
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(req.user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BARBER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar cupom do próprio barbeiro' })
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BARBER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(204)
  @ApiOperation({ summary: 'Excluir cupom do próprio barbeiro' })
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.couponsService.remove(req.user.sub, id);
  }
}

import { Body, Controller, ForbiddenException, Get, NotFoundException, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ServicesService } from './services.service';
import { BarbersService } from '../barbers/barbers.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UserType } from '../users/entities/user.entity';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly barbersService: BarbersService,
  ) {}

  @Get()
  findAll(@Query('barberId') barberId: string) {
    return this.servicesService.findByBarber(barberId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BARBER)
  @ApiBearerAuth()
  async create(@Body() dto: CreateServiceDto, @Request() req: AuthenticatedRequest) {
    const barber = await this.barbersService.findByUserId(req.user.sub);
    if (!barber) throw new NotFoundException('Barber profile not found');
    return this.servicesService.create(dto, barber);
  }
}

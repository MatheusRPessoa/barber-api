import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentStatus } from './entities/appointment.entity';
import { UserType } from '../users/entities/user.entity';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('date') date?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll({
      requestUserId: req.user.sub,
      requestUserType: req.user.type,
      date,
      status,
    });
  }

  @Get('mine')
  findMine(@Request() req: AuthenticatedRequest) {
    return this.appointmentsService.findMine(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.CLIENT)
  create(@Body() dto: CreateAppointmentDto, @Request() req: AuthenticatedRequest) {
    return this.appointmentsService.create(dto, req.user.sub);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(id, dto.STATUS);
  }
}

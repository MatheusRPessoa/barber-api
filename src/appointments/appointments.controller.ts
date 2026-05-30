import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import { UsersService } from '../users/users.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentStatus } from './entities/appointment.entity';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll(
    @Query('barberId') barberId?: string,
    @Query('date') date?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll({ barberId, date, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateAppointmentDto, @Request() req: AuthenticatedRequest) {
    const client = await this.usersService.findById(req.user.sub);
    return this.appointmentsService.create(dto, client!);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(id, dto.STATUS);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentStatus } from './entities/appointment.entity';
import { UserType } from '../users/entities/user.entity';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const APPOINTMENT_BASE = {
  id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  date: '2026-06-15',
  time: '09:30',
  appointment_status: 'PENDING',
};
const SERVICES_INLINE = [
  { id: 'b4cc290f-9cf0-4999-0023-bdf5f7654113', name: 'Corte de cabelo', price: 35.0, duration_minutes: 30 },
  { id: 'c5dd391g-0dh1-5000-1134-ceg6g8765224', name: 'Barba', price: 25.0, duration_minutes: 20 },
];
const BARBER_INLINE = {
  id: 'c5dd391g-8cf0-4999-0023-bdf5f7654113',
  shop_name: 'Barbearia do João',
};
const UNAUTH_EXAMPLE = {
  statusCode: 401,
  message: 'Unauthorized',
  error: 'Unauthorized',
};
const NOT_FOUND_EXAMPLE = {
  statusCode: 404,
  message: 'Appointment not found',
  error: 'Not Found',
};

@ApiTags('Agendamentos')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar agendamentos da barbearia',
    description:
      'Barbeiro autenticado visualiza os agendamentos da sua barbearia. Suporta filtro por data e status',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    example: '2026-06-15',
    description: 'Filtrar por data YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AppointmentStatus,
    description: 'Filtrar por status',
  })
  @ApiResponse({
    status: 200,
    description: 'Agendamentos listados com sucesso',
    schema: {
      example: [
        {
          ...APPOINTMENT_BASE,
          client: {
            id: 'd6ee402h-1ei2-6001-2245-dfh7h9876335',
            user: {
              id: 'd6ee402h-1ei2-6001-2245-dfh7h9876335',
              name: 'João Silva',
              email: 'joao@email.com',
            },
          },
          services: SERVICES_INLINE,
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de sessão não encontrado ou sessão inválida/expirada',
    schema: { example: UNAUTH_EXAMPLE },
  })
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
  @ApiOperation({
    summary: 'Meus agendamentos',
    description:
      'Retorna o histórico completo de agendamentos do cliente autenticado, ordenados por data decrescente',
  })
  @ApiResponse({
    status: 200,
    description: 'Agendamentos retornados com sucesso',
    schema: {
      example: [
        { ...APPOINTMENT_BASE, barber: BARBER_INLINE, services: SERVICES_INLINE },
        {
          ...APPOINTMENT_BASE,
          id: 'b4cc290f-9cf0-4999-0023-bdf5f7654113',
          date: '2026-05-10',
          time: '14:00',
          appointment_status: 'COMPLETED',
          barber: BARBER_INLINE,
          services: SERVICES_INLINE,
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de sessão não encontrado ou sessão inválida/expirada',
    schema: { example: UNAUTH_EXAMPLE },
  })
  findMine(@Request() req: AuthenticatedRequest) {
    return this.appointmentsService.findMine(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar agendamento por ID',
    description: 'Retorna os dados completos de um agendamento específico',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  })
  @ApiResponse({
    status: 200,
    description: 'Agendamento encontrado com sucesso',
    schema: {
      example: {
        ...APPOINTMENT_BASE,
        barber: BARBER_INLINE,
        services: SERVICES_INLINE,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de sessão não encontrado ou sessão inválida/expirada',
    schema: { example: UNAUTH_EXAMPLE },
  })
  @ApiResponse({
    status: 404,
    description: 'Agendamento não encontrado',
    schema: { example: NOT_FOUND_EXAMPLE },
  })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.CLIENT)
  @ApiOperation({
    summary: 'Criar agendamento',
    description:
      'Cliente cria um novo agendamento. Valida se o horário está disponível e se a data não é passada. Status inicial: PENDING',
  })
  @ApiResponse({
    status: 201,
    description: 'Agendamento criado com sucesso',
    schema: {
      example: {
        ...APPOINTMENT_BASE,
        services: SERVICES_INLINE,
        barber: BARBER_INLINE,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Data no passado ou horário indisponível',
    schema: {
      examples: {
        data_passada: {
          summary: 'Data no passado',
          value: {
            statusCode: 400,
            message: 'Date cannot be in the past',
            error: 'Bad Request',
          },
        },
        horario_ocupado: {
          summary: 'Horário já reservado',
          value: {
            statusCode: 400,
            message: 'This time slot is already booked',
            error: 'Bad Request',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de sessão não encontrado ou sessão inválida/expirada',
    schema: { example: UNAUTH_EXAMPLE },
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para realizar esta ação',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  create(
    @Body() dto: CreateAppointmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.appointmentsService.create(dto, req.user.sub);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status do agendamento',
    description:
      'Transições permitidas: PENDING → CONFIRMED | CANCELLED · CONFIRMED → COMPLETED | CANCELLED',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado com sucesso',
    schema: {
      example: {
        ...APPOINTMENT_BASE,
        appointment_status: 'CONFIRMED',
        barber: BARBER_INLINE,
        services: SERVICES_INLINE,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Transição de status inválida',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot transition from COMPLETED to CONFIRMED',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de sessão não encontrado ou sessão inválida/expirada',
    schema: { example: UNAUTH_EXAMPLE },
  })
  @ApiResponse({
    status: 404,
    description: 'Agendamento não encontrado',
    schema: { example: NOT_FOUND_EXAMPLE },
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, dto.STATUS);
  }
}

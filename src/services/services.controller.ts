import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
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
import { ServicesService } from './services.service';
import { BarbersService } from '../barbers/barbers.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UserType } from '../users/entities/user.entity';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const SERVICE_EXAMPLE = {
  id: 'b4cc290f-9cf0-4999-0023-bdf5f7654113',
  name: 'Corte de cabelo',
  price: 35.0,
  duration_minutes: 30,
};
const UNAUTH_EXAMPLE = {
  statusCode: 401,
  message: 'Unauthorized',
  error: 'Unauthorized',
};
const FORBIDDEN_EXAMPLE = {
  statusCode: 403,
  message: 'Forbidden resource',
  error: 'Forbidden',
};

@ApiTags('Serviços')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly barbersService: BarbersService,
  ) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BARBER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar meus serviços',
    description:
      'Retorna todos os serviços cadastrados na barbearia do barbeiro autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Serviços listados com sucesso',
    schema: {
      example: [
        SERVICE_EXAMPLE,
        {
          id: 'c5dd391g-0dh1-5000-1134-ceg6g8765224',
          name: 'Barba',
          price: 25.0,
          duration_minutes: 20,
        },
      ],
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
    schema: { example: FORBIDDEN_EXAMPLE },
  })
  findMine(@Request() req: AuthenticatedRequest) {
    return this.servicesService.findByBarberUserId(req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar serviços por barbearia',
    description:
      'Retorna os serviços de uma barbearia específica pelo ID da barbearia',
  })
  @ApiQuery({
    name: 'barberId',
    type: 'string',
    format: 'uuid',
    required: true,
    example: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  })
  @ApiResponse({
    status: 200,
    description: 'Serviços listados com sucesso',
    schema: { example: [SERVICE_EXAMPLE] },
  })
  findAll(@Query('barberId') barberId: string) {
    return this.servicesService.findByBarber(barberId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BARBER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Criar serviço',
    description:
      'Cria um novo serviço para a barbearia do barbeiro autenticado',
  })
  @ApiResponse({
    status: 201,
    description: 'Serviço criado com sucesso',
    schema: { example: SERVICE_EXAMPLE },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de sessão não encontrado ou sessão inválida/expirada',
    schema: { example: UNAUTH_EXAMPLE },
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para realizar esta ação',
    schema: { example: FORBIDDEN_EXAMPLE },
  })
  async create(
    @Body() dto: CreateServiceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const barber = await this.barbersService.findByUserId(req.user.sub);
    if (!barber) throw new NotFoundException('Barber profile not found');
    return this.servicesService.create(dto, barber);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BARBER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualizar serviço',
    description:
      'Atualiza os dados de um serviço. Só o barbeiro dono do serviço pode realizar esta ação',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'b4cc290f-9cf0-4999-0023-bdf5f7654113',
  })
  @ApiResponse({
    status: 200,
    description: 'Serviço atualizado com sucesso',
    schema: {
      example: {
        ...SERVICE_EXAMPLE,
        name: 'Corte Premium',
        price: 45.0,
        duration_minutes: 45,
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
    schema: { example: FORBIDDEN_EXAMPLE },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const barber = await this.barbersService.findByUserId(req.user.sub);
    if (!barber) throw new ForbiddenException();
    return this.servicesService.update(id, barber.ID, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BARBER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Remover serviço',
    description:
      'Remove um serviço da barbearia. Só o barbeiro dono do serviço pode realizar esta ação',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'b4cc290f-9cf0-4999-0023-bdf5f7654113',
  })
  @ApiResponse({
    status: 200,
    description: 'Serviço removido com sucesso',
    schema: { example: null },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de sessão não encontrado ou sessão inválida/expirada',
    schema: { example: UNAUTH_EXAMPLE },
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para realizar esta ação',
    schema: { example: FORBIDDEN_EXAMPLE },
  })
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const barber = await this.barbersService.findByUserId(req.user.sub);
    if (!barber) throw new ForbiddenException();
    await this.servicesService.remove(id, barber.ID);
  }
}

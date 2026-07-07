import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { BarbersService } from './barbers.service';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { ClientsService } from '../clients/clients.service';
import { ListBarbersQueryDto } from './dto/list-barbers-query.dto';
import { UserType } from '../users/entities/user.entity';

@ApiTags('Barbearias')
@Controller('barbers')
export class BarbersController {
  constructor(
    private readonly barbersService: BarbersService,
    private readonly clientsService: ClientsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obter perfil do barbeiro autenticado',
    description:
      'Retorna os dados cadastrais da barbearia do barbeiro autenticado, junto com nome e e-mail',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil retornado com sucesso',
    schema: {
      example: {
        id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
        shop_name: 'Barbearia do João',
        cnpj: '12.345.678/0001-90',
        rating: 4.8,
        street: 'Rua das Flores',
        number: '123',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310-100',
        name: 'João Silva',
        email: 'joao@email.com',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Perfil de barbeiro não encontrado' })
  getMe(@Request() req: AuthenticatedRequest) {
    return this.barbersService.getMe(req.user.sub);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Listar barbearias',
    description:
      'Retorna todas as barbearias cadastradas com seus serviços, ordenadas por avaliação (rating) decrescente',
  })
  @ApiResponse({
    status: 200,
    description: 'Barbearias listadas com sucesso',
    schema: {
      example: [
        {
          id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
          shop_name: 'Barbearia do João',
          rating: 4.8,
          street: 'Rua das Flores',
          city: 'São Paulo',
          state: 'SP',
          services: [
            {
              id: 'b4cc290f-9cf0-4999-0023-bdf5f7654113',
              name: 'Corte de cabelo',
              price: 35.0,
              duration_minutes: 30,
            },
            {
              id: 'c5dd391g-0dh1-5000-1134-ceg6g8765224',
              name: 'Barba',
              price: 25.0,
              duration_minutes: 20,
            },
          ],
        },
      ],
    },
  })
  async findAll(
    @Query() query: ListBarbersQueryDto,
    @Request() req: { user?: { sub: string; type: UserType } },
  ) {
    const favoriteIds =
      req.user?.type === UserType.CLIENT
        ? await this.clientsService.getFavoriteIds(req.user.sub)
        : undefined;

    return this.barbersService.findAll({
      lat: query.lat,
      lng: query.lng,
      sort: query.sort,
      favoriteIds,
    });
  }

  @Get(':id/services')
  @ApiOperation({
    summary: 'Listar serviços de uma barbearia',
    description:
      'Retorna todos os serviços disponíveis de uma barbearia específica',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  })
  @ApiResponse({
    status: 200,
    description: 'Serviços listados com sucesso',
    schema: {
      example: [
        {
          id: 'b4cc290f-9cf0-4999-0023-bdf5f7654113',
          name: 'Corte de cabelo',
          price: 35.0,
          duration_minutes: 30,
        },
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
    status: 404,
    description: 'Barbearia não encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Barber not found',
        error: 'Not Found',
      },
    },
  })
  findServices(@Param('id') id: string) {
    return this.barbersService.findServicesById(id);
  }

  @Get(':id/available-slots')
  @ApiOperation({
    summary: 'Consultar horários disponíveis',
    description:
      'Retorna os horários disponíveis de 30 em 30 minutos (09:00–18:30). Remove slots já agendados (PENDING/CONFIRMED) e, se a data for hoje, remove os horários já passados',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  })
  @ApiQuery({
    name: 'date',
    type: 'string',
    example: '2026-06-15',
    description: 'Data no formato YYYY-MM-DD',
  })
  @ApiResponse({
    status: 200,
    description: 'Slots disponíveis retornados com sucesso',
    schema: {
      example: {
        date: '2026-06-15',
        available: [
          '09:00',
          '09:30',
          '10:30',
          '11:00',
          '13:30',
          '14:00',
          '16:00',
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Barbearia não encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Barber not found',
        error: 'Not Found',
      },
    },
  })
  getAvailableSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.barbersService.getAvailableSlots(id, date);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualizar perfil da barbearia',
    description:
      'Atualiza os dados do perfil do barbeiro autenticado. Todos os campos são opcionais — envie apenas o que foi alterado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    schema: {
      example: {
        id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
        shop_name: 'Barbearia do João',
        cnpj: '12.345.678/0001-90',
        street: 'Rua das Flores',
        number: '123',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310-100',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de sessão não encontrado ou sessão inválida/expirada',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil de barbeiro não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Barber profile not found',
        error: 'Not Found',
      },
    },
  })
  update(@Request() req: AuthenticatedRequest, @Body() dto: UpdateBarberDto) {
    return this.barbersService.update(req.user.sub, dto);
  }
}

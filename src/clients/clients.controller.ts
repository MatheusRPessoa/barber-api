import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { UpdateClientDto } from './dto/update-client.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('Clientes')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obter perfil do cliente autenticado',
    description:
      'Retorna os dados cadastrais (CPF e endereço) do cliente autenticado, junto com nome e e-mail',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil retornado com sucesso',
    schema: {
      example: {
        id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
        cpf: '123.456.789-09',
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
  @ApiResponse({ status: 404, description: 'Perfil de cliente não encontrado' })
  getMe(@Request() req: AuthenticatedRequest) {
    return this.clientsService.getMe(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualizar perfil do cliente',
    description:
      'Atualiza os dados do perfil do cliente autenticado. Todos os campos são opcionais — envie apenas o que foi alterado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    schema: {
      example: {
        id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
        cpf: '123.456.789-09',
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
  @ApiResponse({ status: 404, description: 'Perfil de cliente não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'CPF já está em uso por outra conta',
    schema: {
      example: {
        statusCode: 409,
        message: 'CPF already in use',
        error: 'Conflict',
      },
    },
  })
  update(@Request() req: AuthenticatedRequest, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(req.user.sub, dto);
  }
}

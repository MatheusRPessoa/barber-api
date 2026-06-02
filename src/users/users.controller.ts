import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { SavePushTokenDto } from './dto/save-push-token.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('Usuários')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obter perfil do usuário autenticado',
    description:
      'Retorna os dados do usuário autenticado. Não inclui dados sensíveis como senha ou refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil retornado com sucesso',
    schema: {
      example: {
        ID: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
        NAME: 'João Silva',
        EMAIL: 'joao@email.com',
        TYPE: 'CLIENT',
        CRIADO_EM: '2026-06-01T12:00:00.000Z',
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
  getMe(@Request() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.sub);
  }

  @Post('push-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Salvar push token',
    description: 'Registra o token do dispositivo Expo para envio de notificações push',
  })
  @ApiResponse({ status: 200, description: 'Token salvo com sucesso' })
  @ApiResponse({ status: 401, description: 'Token de sessão não encontrado ou sessão inválida/expirada' })
  savePushToken(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SavePushTokenDto,
  ) {
    return this.usersService.savePushToken(req.user.sub, dto.TOKEN);
  }
}

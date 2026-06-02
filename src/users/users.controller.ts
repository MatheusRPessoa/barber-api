import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('Usuários')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Obter perfil do usuário autenticado' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil retornado com sucesso' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token de sessão não encontrado ou sessão inválida/expirada' 
  })
  getMe(@Request() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.sub);
  }
}

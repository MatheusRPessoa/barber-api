import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Registrar usuário', 
    description: 'Cria um novo usuário (cliente ou barbeiro)' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuário registrado com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos' 
  })
  @ApiResponse({ 
    status: 409,
    description: 'E-mail ou CNPJ já cadastrado' 
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Realizar login', 
    description: 'Autentica o usuário e retorna tokens JWT' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Login efetuado com sucesso' 
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Renovar tokens' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tokens renovados com sucesso' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token de sessão não encontrado ou sessão inválida/expirada' 
  })
  refresh(@Request() req: AuthenticatedRequest) {
    return this.authService.refresh(req.user.sub, req.user.refreshToken!);
  }

  @Post('logout')
  @ApiOperation({ 
    summary: 'Realizar logout', 
    description: 'Invalida o refresh token e encerra a sessão' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Logout realizado com sucesso' 
  })
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obter dados do usuário autenticado' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dados retornados com sucesso' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token de sessão não encontrado ou sessão inválida/expirada' 
  })
  me(@Request() req: AuthenticatedRequest) {
    return this.authService.me(req.user.sub);
  }

  @Post('forgot-password')
  @ApiOperation({ 
    summary: 'Solicitar recuperação de senha', 
    description: 'Envia e-mail com instruções para resetar a senha' 
  })
  @ApiResponse({
     status: 201, 
     description: 'E-mail de recuperação enviado (se o usuário existir)' 
    })
  @ApiResponse({ 
    status: 400, 
    description: 'E-mail inválido' 
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.EMAIL);
  }

  @Post('reset-password')
  @ApiOperation({ 
    summary: 'Resetar senha', 
    description: 'Reseta a senha usando token de recuperação' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Senha resetada com sucesso'
  })
  @ApiResponse({
     status: 400, 
     description: 'Token de reset inválido ou expirado' 
    })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}

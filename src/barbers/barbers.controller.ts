import { Body, Controller, Get, Param, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BarbersService } from './barbers.service';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('Barbearias')
@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar barbearias', 
    description: 'Retorna todas as barbearias com serviços, ordenadas por avaliação' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Barbearias listadas com sucesso' 
  })
  findAll() {
    return this.barbersService.findAll();
  }

  @Get(':id/services')
  @ApiOperation({ 
    summary: 'Listar serviços de uma barbearia' 
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid', 
    example: 'a3bb189e-8bf9-3888-9912-ace4e6543002' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Serviços listados com sucesso' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Barbearia não encontrada' 
  })
  findServices(@Param('id') id: string) {
    return this.barbersService.findServicesById(id);
  }

  @Get(':id/available-slots')
  @ApiOperation({ 
    summary: 'Consultar horários disponíveis', 
    description: 'Retorna os slots de 30 min disponíveis para agendamento em uma data' 
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid', 
    example: 'a3bb189e-8bf9-3888-9912-ace4e6543002' 
  })
  @ApiQuery({ 
    name: 'date', 
    type: 'string', 
    example: '2026-06-15', 
    description: 'Data no formato YYYY-MM-DD' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Slots disponíveis retornados com sucesso' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Barbearia não encontrada' 
  })
  getAvailableSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.barbersService.getAvailableSlots(id, date);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Atualizar perfil da barbearia', 
    description: 'Atualiza dados do barbeiro autenticado' 
  })
  @ApiResponse({
     status: 200, 
     description: 'Perfil atualizado com sucesso' 
    })
  @ApiResponse({ 
    status: 401, 
    description: 'Token de sessão não encontrado ou sessão inválida/expirada' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Perfil de barbeiro não encontrado' 
  })
  update(@Request() req: AuthenticatedRequest, @Body() dto: UpdateBarberDto) {
    return this.barbersService.update(req.user.sub, dto);
  }
}

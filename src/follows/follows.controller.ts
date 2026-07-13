import { Controller, HttpCode, Param, Post, UseGuards, Request, Delete, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FollowsService } from "./follows.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserType } from "../users/entities/user.entity";
import type { AuthenticatedRequest } from "../common/interfaces/authenticated-request.interface";

@ApiTags('Seguidores')
@Controller('barbers')
export class FollowsController {
    constructor(private readonly follows: FollowsService) {}

    @Post(':id/follow')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserType.CLIENT)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(204)
    @ApiOperation({ summary: 'Seguir barbearia (cliente) - idempotente' })
    follow(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.follows.follow(req.user.sub, id);
    }

    @Delete(':id/follow')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserType.CLIENT)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(204)
    @ApiOperation({ summary: 'Deixar de seguir (cliente) - idempotente' })
    unfollow(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.follows.unfollow(req.user.sub, id);
    }

    @Get(':id/followers')
    @ApiOperation({ summary: 'Total de seguidores (público)' })
    async followers(@Param('id') id: string) {
        return { count: await this.follows.followersCount(id) };
    }
}
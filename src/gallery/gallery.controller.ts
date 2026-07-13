import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserType } from '../users/entities/user.entity';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { GalleryService } from './gallery.service';
import { CreateGalleryPostDto } from './dto/create-gallery-post.dto';

const MARX_IMAGE_BYTES = 5 * 1024 * 1024;



@ApiTags('Galeria')
@Controller()
export class GalleryController {
    constructor(private readonly gallery: GalleryService) {}

    @Post('barbers/me/galley')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserType.BARBER)
    @ApiBearerAuth('JWT-auth')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Publicar foto na galeria (barbeiro)' })
    @UseInterceptors(FileInterceptor('IMAGE', { storage: memoryStorage() }))
    create(
        @Request() req: AuthenticatedRequest,
        @UploadedFile(
            new ParseFilePipe({
                errorHttpStatusCode: HttpStatus.BAD_REQUEST,
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: MARX_IMAGE_BYTES,
                        message: 'Image too large (max 5MB)',
                    }),
                    new FileTypeValidator({ fileType: 'image/(jpeg|png|webp' }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Body() dto: CreateGalleryPostDto,
    ) {
        return this.gallery.create(req.user.sub, file, dto.CAPTION);
    }

    @Delete('barbers/me/gallery/:postId')
    @UseGuards(JwtAuthGuard, Roles)
    @Roles(UserType.BARBER)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(204)
    @ApiOperation({ summary: 'Remover foto (barbeiro dono)' })
    remove(@Request() req: AuthenticatedRequest, @Param('postId') postId: string) {
        return this.gallery.remove(req.user.sub, postId);
    }

    @Get('barbers/:id/gallery')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Galeria pública de barbearia' })
    list(
        @Param('id') id: string,
        @Request() req: { user?: {sub: string; type: UserType} },
    ) {
        const clientUserId = 
            req.user?.type === UserType.CLIENT ? req.user.sub : undefined;
        return this.gallery.listByBarber(id, clientUserId);
    }

    @Post('gallery/:postId/like')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserType.CLIENT)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(204)
    @ApiOperation({ summary: 'Curtir foto (cliente) - idempotente' })
    like(@Request() req: AuthenticatedRequest, @Param('postId') postId: string) {
        return this.gallery.like(req.user.sub, postId);
    }

    @Delete('gallery/:postId/like')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserType.CLIENT)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(204)
    @ApiOperation({ summary: 'Descurtir foto (cliente) - idempotente' })
    unlike(@Request() req: AuthenticatedRequest, @Param('postId') postId: string) {
        return this.gallery.unlike(req.user.sub, postId);
    }
}
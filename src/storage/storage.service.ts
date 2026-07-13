import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';

const MIME_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png' : '.png',
    'image/webp': '.webp',
};

/**
 * Abstração de storage. Hoje: disco local + rota estática (/api/uploads).
 * Para migrar para Cloudinary/S3, trocar apenas save/delete/urlFor —
 * controllers e serviços não mudam, e o contrato (image_url absoluta) é o mesmo.
 */
@Injectable()
export class StorageService {
    private readonly dir = join(process.cwd(), 'uploads');

    constructor(private readonly config: ConfigService) {}

    private get publicUrl(): string {
        return (this.config.get<string>('PUBLIC_URL') ?? 'http://localhost:3001').replace(/\/$/, '');
    }

  async save(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname) || MIME_EXT[file.mimetype] || '';
    const key = `${randomUUID()}${ext}`;
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, key), file.buffer);
    return key;
  }

  async delete(key: string): Promise<void> {
    await rm(join(this.dir, key), { force: true });
  }

  urlFor(key: string): string {
    return `${this.publicUrl}/api/uploads/${key}`
  }
}
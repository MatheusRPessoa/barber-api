import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GalleryPost } from "./entities/gallery-post.entity";
import { GalleryLike } from "./entities/gallery-like.entity";
import { Barber } from "../barbers/entities/barber.entity";
import { GalleryService } from "./gallery.service";

@Module({
    imports: [TypeOrmModule.forFeature([GalleryPost, GalleryLike, Barber])],
    controllers: [GalleryService],
    providers: [GalleryService],
})
export class GalleryModule {}
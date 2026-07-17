import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { File } from 'multer';
import {
  ChunkStatusDto,
  ChunkUploadDto,
  CompleteUploadDto,
  InitiateUploadDto,
} from 'src/DTO/chunk.dto';
import { AdminGuard } from 'src/middleware/AdminGuard';
import { AuthGuard } from 'src/middleware/AuthGuard';
import { ImageService } from 'src/services/image.service';

@ApiTags('images')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Récupérer une image' })
  async sendImage(
    @Query('path') path: string,
    @Query('rotate') rotate: number,
    @Query('width') width: number,
    @Query('quality') quality: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const image = await this.imageService.sendImage(
      path,
      rotate,
      width,
      quality,
    );
    response.setHeader(
      'Cache-Control',
      'private, max-age=3600, stale-while-revalidate=86400',
    );
    return image;
  }

  @Post('hike/:hikeId')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      limits: { files: 20, fileSize: 20 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Créer une image' })
  async createImage(
    @UploadedFiles() files: File[],
    @Param('hikeId') hikeId: string,
  ) {
    if (!files?.length) {
      throw new BadRequestException('Aucune image fournie');
    }
    return this.imageService.createImage(hikeId, files);
  }

  @Delete(':imageId')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Supprimer une image' })
  async deleteImage(@Param('imageId') imageId: string) {
    return this.imageService.deleteImage(imageId);
  }

  @Put('rotate/:imageId')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Tourner une image' })
  async rotateImage(@Param('imageId') imageId: string) {
    return this.imageService.rotateImage(imageId);
  }

  @Put('reorder/:hikeId')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Réordonner les images' })
  async reorderImage(
    @Param('hikeId') hikeId: string,
    @Body() body: { imageIds: string[] },
  ) {
    return this.imageService.reorderImage(hikeId, body.imageIds);
  }

  @Post('chunk/initiate')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Initier un upload par chunks' })
  async initiateChunkUpload(@Body() initiateUploadDto: InitiateUploadDto) {
    return this.imageService.initiateChunkUpload(initiateUploadDto);
  }

  @Post('chunk/upload')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('chunk', { limits: { fileSize: 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Uploader un chunk' })
  async uploadChunk(
    @UploadedFile() chunk: File,
    @Body() chunkUploadDto: ChunkUploadDto,
  ) {
    if (!chunk?.buffer?.length) {
      throw new BadRequestException('Chunk manquant');
    }
    return this.imageService.uploadChunk(chunk, chunkUploadDto);
  }

  @Get('chunk/status/:fileHash')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: "Obtenir le statut d'upload par chunks" })
  async getChunkStatus(
    @Param('fileHash') fileHash: string,
  ): Promise<ChunkStatusDto> {
    return this.imageService.getChunkStatus(fileHash);
  }

  @Post('chunk/complete')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: "Finaliser l'upload par chunks" })
  async completeChunkUpload(@Body() completeUploadDto: CompleteUploadDto) {
    return this.imageService.completeChunkUpload(completeUploadDto);
  }

  @Delete('chunk/cancel/:fileHash')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: "Annuler l'upload par chunks" })
  async cancelChunkUpload(@Param('fileHash') fileHash: string) {
    return this.imageService.cancelChunkUpload(fileHash);
  }

  @Post('cleanup/orphans')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Nettoyer les images orphelines' })
  async cleanupOrphanImages() {
    return this.imageService.cleanupOrphanImages();
  }
}

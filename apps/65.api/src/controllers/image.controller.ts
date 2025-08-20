import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { File } from 'multer';
import {
  ChunkStatusDto,
  ChunkUploadDto,
  CompleteUploadDto,
  InitiateUploadDto,
} from 'src/DTO/chunk.dto';
import { AuthGuard } from 'src/middleware/AuthGuard';
import { ImageService } from 'src/services/image.service';

@ApiTags('images')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get()
  @Header('Cache-Control', 'max-age=3600')
  @ApiOperation({ summary: 'Récupérer une image' })
  async sendImage(
    @Query('path') path: string,
    @Query('rotate') rotate: number,
  ): Promise<StreamableFile> {
    return this.imageService.sendImage(path, rotate);
  }

  @Post('hike/:hikeId')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Créer une image' })
  async createImage(
    @UploadedFiles() files: File[],
    @Param('hikeId') hikeId: string,
  ) {
    return this.imageService.createImage(hikeId, files);
  }

  @Delete(':imageId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Supprimer une image' })
  async deleteImage(@Param('imageId') imageId: string) {
    return this.imageService.deleteImage(imageId);
  }

  @Put('rotate/:imageId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Tourner une image' })
  async rotateImage(@Param('imageId') imageId: string) {
    console.log(imageId);
    return this.imageService.rotateImage(imageId);
  }

  @Put('reorder/:hikeId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Réordonner les images' })
  async reorderImage(
    @Param('hikeId') hikeId: string,
    @Body() body: { imageIds: string[] },
  ) {
    return this.imageService.reorderImage(hikeId, body.imageIds);
  }

  @Post('chunk/initiate')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Initier un upload par chunks' })
  async initiateChunkUpload(@Body() initiateUploadDto: InitiateUploadDto) {
    return this.imageService.initiateChunkUpload(initiateUploadDto);
  }

  @Post('chunk/upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('chunk'))
  @ApiOperation({ summary: 'Uploader un chunk' })
  async uploadChunk(
    @UploadedFile() chunk: File,
    @Body() chunkUploadDto: ChunkUploadDto,
  ) {
    return this.imageService.uploadChunk(chunk, chunkUploadDto);
  }

  @Get('chunk/status/:fileHash')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Obtenir le statut d'upload par chunks" })
  async getChunkStatus(
    @Param('fileHash') fileHash: string,
  ): Promise<ChunkStatusDto> {
    return this.imageService.getChunkStatus(fileHash);
  }

  @Post('chunk/complete')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Finaliser l'upload par chunks" })
  async completeChunkUpload(@Body() completeUploadDto: CompleteUploadDto) {
    return this.imageService.completeChunkUpload(completeUploadDto);
  }

  @Delete('chunk/cancel/:fileHash')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Annuler l'upload par chunks" })
  async cancelChunkUpload(@Param('fileHash') fileHash: string) {
    return this.imageService.cancelChunkUpload(fileHash);
  }

  @Post('cleanup/orphans')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Nettoyer les images orphelines' })
  async cleanupOrphanImages() {
    return this.imageService.cleanupOrphanImages();
  }
}

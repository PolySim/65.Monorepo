import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { File } from 'multer';
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
}

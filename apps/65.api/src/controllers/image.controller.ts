import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { File } from 'multer';
import { AuthGuard } from 'src/middleware/AuthGuard';
import { ImageService } from 'src/services/image.service';

@ApiTags('images')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer une image' })
  async sendImage(@Res() res: Response, @Query('path') path: string) {
    if (path === 'undefined') {
      return res.status(404).send('Image not found');
    }
    return res.sendFile(await this.imageService.sendImage(path));
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
}

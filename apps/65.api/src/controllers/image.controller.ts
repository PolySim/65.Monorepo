import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ImageService } from 'src/services/image.service';

@ApiTags('images')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer une image' })
  async sendImage(@Res() res: Response, @Query('path') path: string) {
    return res.sendFile(await this.imageService.sendImage(path));
  }
}

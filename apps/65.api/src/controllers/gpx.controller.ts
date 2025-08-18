import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { File } from 'multer';
import { GpxService } from 'src/services/gpx.service';

@ApiTags('gpx')
@Controller('gpx')
export class GpxController {
  constructor(private readonly gpxService: GpxService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer un fichier GPX' })
  async sendGpxFile(@Res() res: Response, @Query('path') path: string) {
    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${path}"`);
    return res.sendFile(await this.gpxService.sendGpxFile(path));
  }

  @Post('create/:hikeId')
  @UseInterceptors(FileInterceptor('gpx'))
  @ApiOperation({ summary: 'Créer un fichier GPX' })
  async createGpxFile(
    @UploadedFile() file: File,
    @Param('hikeId') hikeId: string,
  ) {
    return this.gpxService.createGpxFile(hikeId, file);
  }
}

import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
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
}

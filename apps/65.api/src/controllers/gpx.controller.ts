import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { File } from 'multer';
import { basename } from 'path';
import { AdminGuard } from 'src/middleware/AdminGuard';
import { AuthGuard } from 'src/middleware/AuthGuard';
import { GpxService } from 'src/services/gpx.service';

@ApiTags('gpx')
@Controller('gpx')
export class GpxController {
  constructor(private readonly gpxService: GpxService) {}

  private validateGpxFile(file?: File): asserts file is File {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier GPX manquant');
    }

    const fileStart = file.buffer
      .subarray(0, Math.min(file.buffer.length, 16 * 1024))
      .toString('utf8');

    if (
      !file.originalname.toLowerCase().endsWith('.gpx') ||
      !/<gpx(?:\s|>)/i.test(fileStart)
    ) {
      throw new BadRequestException('Fichier GPX invalide');
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Récupérer un fichier GPX' })
  async sendGpxFile(@Res() res: Response, @Query('path') path: string) {
    const filePath = await this.gpxService.sendGpxFile(path);
    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${basename(filePath)}"`,
    );
    return res.sendFile(filePath);
  }

  @Post('create/:hikeId')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('gpx', {
      limits: {
        fileSize: 1024 * 1024 * 50,
      },
    }),
  )
  @ApiOperation({ summary: 'Créer un fichier GPX' })
  async createGpxFile(
    @UploadedFile() file: File,
    @Param('hikeId') hikeId: string,
  ) {
    this.validateGpxFile(file);
    return this.gpxService.createGpxFile(hikeId, file);
  }

  @Delete('delete/:hikeId')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Supprimer un fichier GPX' })
  async deleteGpxFile(@Param('hikeId') hikeId: string) {
    return this.gpxService.deleteGpxFile(hikeId);
  }
}

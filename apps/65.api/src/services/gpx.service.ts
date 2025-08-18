import { Injectable } from '@nestjs/common';
import { File } from 'multer';
import { GpxRepository } from 'src/repository/gpx.repository';

@Injectable()
export class GpxService {
  constructor(private readonly gpxRepository: GpxRepository) {}

  async sendGpxFile(path: string) {
    return this.gpxRepository.sendGpxFile(path);
  }

  async createGpxFile(hikeId: string, file: File) {
    return this.gpxRepository.createGpxFile(hikeId, file);
  }
}

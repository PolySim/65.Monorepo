import { Injectable } from '@nestjs/common';
import { GpxRepository } from 'src/repository/gpx.repository';

@Injectable()
export class GpxService {
  constructor(private readonly gpxRepository: GpxRepository) {}

  async sendGpxFile(path: string) {
    return this.gpxRepository.sendGpxFile(path);
  }
}

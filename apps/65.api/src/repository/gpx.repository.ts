import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { config } from '../config/config';
import { HikeGPX } from '../entities/higeGPX.entity';

@Injectable()
export class GpxRepository extends Repository<HikeGPX> {
  constructor(private dataSource: DataSource) {
    super(HikeGPX, dataSource.createEntityManager());
  }

  async sendGpxFile(path: string) {
    return `${config.gpx_path}/${path}`;
  }
}

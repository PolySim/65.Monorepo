import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { File } from 'multer';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
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

  async createGpxFile(hikeId: string, file: File) {
    const lastGpxFile = await this.findOne({
      where: { hikeId },
    });
    if (lastGpxFile) {
      await this.delete(lastGpxFile.id);
      await fs.promises.unlink(`${config.gpx_path}/${lastGpxFile.path}`);
    }
    const gpxFile = new HikeGPX();
    const id = uuidv4();
    const path = `${id}.gpx`;
    gpxFile.id = id;
    gpxFile.hikeId = hikeId;
    gpxFile.path = path;
    await this.uploadGpxFile(path, file);
    return await this.save(gpxFile);
  }

  private async uploadGpxFile(path: string, file: File) {
    const directoryPath = `${config.gpx_path}`;
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    await fs.promises.writeFile(`${directoryPath}/${path}`, file.buffer);
  }
}

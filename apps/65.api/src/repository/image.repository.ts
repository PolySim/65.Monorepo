import { Injectable } from '@nestjs/common';
import { config } from 'src/config/config';
import { DataSource } from 'typeorm';

@Injectable()
export class ImageRepository {
  constructor(private dataSource: DataSource) {}

  async sendImage(path: string) {
    return `${config.image_path}/${path}`;
  }
}

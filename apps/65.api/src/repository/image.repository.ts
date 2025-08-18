import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { File } from 'multer';
import * as sharp from 'sharp';
import { config } from 'src/config/config';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Image } from '../entities/image.entity';

@Injectable()
export class ImageRepository extends Repository<Image> {
  constructor(private dataSource: DataSource) {
    super(Image, dataSource.createEntityManager());
  }

  async sendImage(path: string) {
    return `${config.image_path}/${path}`;
  }

  async createImage(hikeId: string, files: File[]): Promise<Image[]> {
    const numberMax =
      (await this.count({
        where: {
          hikeId,
        },
      })) + 1;
    return await Promise.all(
      files.map(async (file, i) => {
        const newId = uuidv4();
        const path = `${newId}.${(file.originalname ?? '').split('.').slice(-1)[0]}`;
        const newImage = new Image();
        newImage.id = newId;
        newImage.hikeId = hikeId;
        newImage.path = `Hike/${path}`;
        newImage.ordered = numberMax + i;
        await this.uploadImage({ name: path, file });
        const saved = await this.save(newImage);
        return saved;
      }),
    );
  }

  private async uploadImage({ name, file }: { name: string; file: File }) {
    const directoryPath = `${config.image_path}/Hike`;
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await sharp(file.buffer).toFile(`${directoryPath}/${name}`);
  }
}

import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import { File } from 'multer';
import { extname } from 'path';
import * as sharp from 'sharp';
import { config } from 'src/config/config';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Image } from '../entities/image.entity';

@Injectable()
export class ImageRepository extends Repository<Image> {
  constructor(private dataSource: DataSource) {
    super(Image, dataSource.createEntityManager());
  }

  async sendImage(path: string, rotate: number) {
    const image = await this.findOne({
      where: { path },
    });
    if (path === 'undefined') throw new NotFoundException('Image not found');
    const globalPath = `${config.image_path}/${path}`;
    const globalRotate = Number(rotate) ?? image?.rotate ?? 0;
    const rotatedFile = await sharp(globalPath).rotate(globalRotate).toBuffer();

    const ext = extname(globalPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    return new StreamableFile(rotatedFile, {
      type: mimeTypes[ext] || 'application/octet-stream',
      disposition: 'inline',
    });
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

  async deleteImage(imageId: string) {
    const image = await this.findOne({
      where: {
        id: imageId,
      },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    const directoryPath = `${config.image_path}/${image.path}`;
    if (fs.existsSync(directoryPath)) {
      fs.unlinkSync(directoryPath);
    }
    await this.delete(image);
  }

  async rotateImage(imageId: string) {
    const image = await this.findOne({
      where: {
        id: imageId,
      },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    const rotate = (image.rotate ?? 0) + 90;
    return await this.update(image.id, {
      rotate: rotate >= 360 ? 0 : rotate,
    });
  }

  async reorderImage(hikeId: string, imageIds: string[]) {
    const images = await this.find({
      where: {
        hikeId,
        id: In(imageIds),
      },
    });
    await Promise.all(
      images.map(async (image) =>
        this.update(image.id, {
          ordered: imageIds.indexOf(image.id),
        }),
      ),
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

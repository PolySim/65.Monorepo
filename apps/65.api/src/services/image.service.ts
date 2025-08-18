import { Injectable } from '@nestjs/common';
import { File } from 'multer';
import { Image } from 'src/entities/image.entity';
import { ImageRepository } from 'src/repository/image.repository';

@Injectable()
export class ImageService {
  constructor(private readonly imageRepository: ImageRepository) {}

  async sendImage(path: string): Promise<string> {
    return this.imageRepository.sendImage(path);
  }

  async createImage(hikeId: string, files: File[]): Promise<Image[]> {
    return this.imageRepository.createImage(hikeId, files);
  }
}

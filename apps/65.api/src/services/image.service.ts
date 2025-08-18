import { Injectable, StreamableFile } from '@nestjs/common';
import { File } from 'multer';
import { Image } from 'src/entities/image.entity';
import { ImageRepository } from 'src/repository/image.repository';

@Injectable()
export class ImageService {
  constructor(private readonly imageRepository: ImageRepository) {}

  async sendImage(path: string, rotate: number): Promise<StreamableFile> {
    return this.imageRepository.sendImage(path, rotate);
  }

  async createImage(hikeId: string, files: File[]): Promise<Image[]> {
    return this.imageRepository.createImage(hikeId, files);
  }

  async deleteImage(imageId: string) {
    return this.imageRepository.deleteImage(imageId);
  }

  async rotateImage(imageId: string) {
    return this.imageRepository.rotateImage(imageId);
  }
}

import { Injectable } from '@nestjs/common';
import { ImageRepository } from 'src/repository/image.repository';

@Injectable()
export class ImageService {
  constructor(private readonly imageRepository: ImageRepository) {}

  async sendImage(path: string): Promise<string> {
    return this.imageRepository.sendImage(path);
  }
}

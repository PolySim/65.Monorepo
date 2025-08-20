import { Injectable, StreamableFile } from '@nestjs/common';
import { File } from 'multer';
import {
  ChunkStatusDto,
  ChunkUploadDto,
  CompleteUploadDto,
  InitiateUploadDto,
} from 'src/DTO/chunk.dto';
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

  async reorderImage(hikeId: string, imageIds: string[]) {
    return this.imageRepository.reorderImage(hikeId, imageIds);
  }

  async initiateChunkUpload(initiateUploadDto: InitiateUploadDto) {
    return this.imageRepository.initiateChunkUpload(initiateUploadDto);
  }

  async uploadChunk(chunk: File, chunkUploadDto: ChunkUploadDto) {
    return this.imageRepository.uploadChunk(chunk, chunkUploadDto);
  }

  async getChunkStatus(fileHash: string): Promise<ChunkStatusDto> {
    return this.imageRepository.getChunkStatus(fileHash);
  }

  async completeChunkUpload(
    completeUploadDto: CompleteUploadDto,
  ): Promise<Image> {
    return this.imageRepository.completeChunkUpload(completeUploadDto);
  }

  async cancelChunkUpload(fileHash: string) {
    return this.imageRepository.cancelChunkUpload(fileHash);
  }

  async cleanupOrphanImages() {
    return this.imageRepository.cleanupOrphanImages();
  }
}

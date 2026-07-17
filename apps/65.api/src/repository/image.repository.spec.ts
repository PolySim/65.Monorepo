import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { Readable } from 'stream';
import { DataSource } from 'typeorm';
import { Image } from '../entities/image.entity';
import { ImageRepository } from './image.repository';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createReadStream: jest.fn(),
}));

describe('ImageRepository', () => {
  let repository: ImageRepository;
  let dataSource: {
    createEntityManager: jest.Mock;
    getRepository: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    dataSource = {
      createEntityManager: jest.fn(() => ({})),
      getRepository: jest.fn(),
    };
    repository = new ImageRepository(dataSource as unknown as DataSource);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('refuse un hash qui sortirait du répertoire temporaire', async () => {
    await expect(
      repository.initiateChunkUpload({
        fileHash: '../../../65.Monorepo',
        fileName: 'photo.jpg',
        hikeId: 'hike-id',
        fileSize: 1024,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refuse aussi un hash malveillant lors de l'annulation", async () => {
    await expect(
      repository.cancelChunkUpload('../../database.db'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sert une image de catégorie lorsque la rotation est omise', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    dataSource.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ id: 'category-id' }),
    });
    jest
      .spyOn(
        repository as unknown as {
          resolveManagedImagePath(path: string): string;
        },
        'resolveManagedImagePath',
      )
      .mockReturnValue('/tmp/category.jpg');
    jest
      .mocked(fs.createReadStream)
      .mockReturnValue(Readable.from(Buffer.from('image')) as fs.ReadStream);

    await expect(
      repository.sendImage(
        'Category/category.jpg',
        undefined as unknown as number,
      ),
    ).resolves.toBeDefined();
  });

  it('ne touche pas au fichier si la suppression en base échoue', async () => {
    const image = Object.assign(new Image(), {
      id: 'image-id',
      path: 'Hike/photo.jpg',
    });
    jest.spyOn(repository, 'findOne').mockResolvedValue(image);
    jest.spyOn(repository, 'delete').mockRejectedValue(new Error('db failure'));
    const resolvePath = jest.spyOn(
      repository as unknown as {
        resolveManagedImagePath(path: string): string;
      },
      'resolveManagedImagePath',
    );

    await expect(repository.deleteImage(image.id)).rejects.toThrow(
      'db failure',
    );
    expect(resolvePath).not.toHaveBeenCalled();
  });
});

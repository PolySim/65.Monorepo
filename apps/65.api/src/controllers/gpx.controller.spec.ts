import { BadRequestException } from '@nestjs/common';
import { File } from 'multer';
import { GpxService } from '../services/gpx.service';
import { GpxController } from './gpx.controller';

jest.mock('src/middleware/AuthGuard', () => ({ AuthGuard: class {} }));
jest.mock('src/middleware/AdminGuard', () => ({ AdminGuard: class {} }));

const createFile = (contents: string, name = 'trace.gpx') =>
  ({
    buffer: Buffer.from(contents),
    originalname: name,
  }) as File;

describe('GpxController', () => {
  const createGpxFile = jest.fn();
  const service = { createGpxFile } as unknown as GpxService;
  const controller = new GpxController(service);

  beforeEach(() => {
    createGpxFile.mockReset();
  });

  it('refuse un upload sans fichier', async () => {
    await expect(
      controller.createGpxFile(undefined as unknown as File, 'hike-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(createGpxFile).not.toHaveBeenCalled();
  });

  it('refuse un fichier qui ne contient pas de racine GPX', async () => {
    await expect(
      controller.createGpxFile(createFile('<html></html>'), 'hike-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(createGpxFile).not.toHaveBeenCalled();
  });

  it('transmet un fichier GPX valide au service', async () => {
    const file = createFile('<?xml version="1.0"?><gpx version="1.1"></gpx>');
    createGpxFile.mockResolvedValue({ id: 'gpx-id' });

    await controller.createGpxFile(file, 'hike-id');

    expect(createGpxFile).toHaveBeenCalledWith('hike-id', file);
  });
});

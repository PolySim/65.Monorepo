import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { File } from 'multer';
import { DataSource } from 'typeorm';
import { GpxRepository } from './gpx.repository';

describe('GpxRepository', () => {
  const transactionRepository = {
    delete: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const dataSource = {
    createEntityManager: jest.fn(() => ({})),
    transaction: jest.fn((callback) =>
      callback({ getRepository: () => transactionRepository }),
    ),
  } as unknown as DataSource;
  let repository: GpxRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new GpxRepository(dataSource);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('refuse un chemin de base qui sort du volume GPX', async () => {
    jest
      .spyOn(repository, 'findOne')
      .mockResolvedValue({ path: '../../database.db' } as never);

    await expect(
      repository.sendGpxFile('../../database.db'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("ne démarre aucune mutation si le fichier d'upload est absent", async () => {
    await expect(
      repository.createGpxFile('hike-id', undefined as unknown as File),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('supprime le nouveau fichier si la transaction échoue', async () => {
    const writeFile = jest
      .spyOn(fs.promises, 'writeFile')
      .mockResolvedValue(undefined);
    const unlink = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        (path) => !String(path).toLowerCase().endsWith('.gpx'),
      );
    transactionRepository.findOne.mockResolvedValue({
      id: 'old-id',
      path: 'old.gpx',
    });
    transactionRepository.delete.mockResolvedValue(undefined);
    transactionRepository.save.mockRejectedValue(new Error('database failure'));

    const file = {
      buffer: Buffer.from('<gpx></gpx>'),
      originalname: 'trace.gpx',
    } as File;

    await expect(repository.createGpxFile('hike-id', file)).rejects.toThrow(
      'database failure',
    );
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(unlink).toHaveBeenCalledTimes(1);
  });
});

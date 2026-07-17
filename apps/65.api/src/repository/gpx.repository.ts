import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { File } from 'multer';
import { isAbsolute, relative, resolve } from 'path';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';
import { HikeGPX } from '../entities/higeGPX.entity';

@Injectable()
export class GpxRepository extends Repository<HikeGPX> {
  constructor(private dataSource: DataSource) {
    super(HikeGPX, dataSource.createEntityManager());
  }

  private resolveManagedGpxPath(
    storedPath: string,
    requireFile = true,
  ): string {
    const gpxRoot = resolve(config.gpx_path);
    const candidatePath = resolve(gpxRoot, storedPath);
    const candidateFromRoot = relative(gpxRoot, candidatePath);

    if (
      !candidateFromRoot ||
      candidateFromRoot.startsWith('..') ||
      isAbsolute(candidateFromRoot)
    ) {
      throw new NotFoundException('GPX file not found');
    }

    if (!fs.existsSync(candidatePath)) {
      if (requireFile) {
        throw new NotFoundException('GPX file not found');
      }
      return candidatePath;
    }

    const realGpxRoot = fs.realpathSync(gpxRoot);
    const realGpxPath = fs.realpathSync(candidatePath);
    const realPathFromRoot = relative(realGpxRoot, realGpxPath);

    if (
      !realPathFromRoot ||
      realPathFromRoot.startsWith('..') ||
      isAbsolute(realPathFromRoot) ||
      !fs.statSync(realGpxPath).isFile()
    ) {
      throw new NotFoundException('GPX file not found');
    }

    return realGpxPath;
  }

  async sendGpxFile(path: string): Promise<string> {
    if (!path || path === 'undefined') {
      throw new NotFoundException('GPX file not found');
    }

    const gpxFile = await this.findOne({ where: { path } });
    if (!gpxFile) {
      throw new NotFoundException('GPX file not found');
    }

    return this.resolveManagedGpxPath(gpxFile.path);
  }

  async createGpxFile(hikeId: string, file: File) {
    if (!file?.buffer?.length) {
      throw new NotFoundException('GPX file not found');
    }

    const gpxFile = new HikeGPX();
    const id = uuidv4();
    const path = `${id}.gpx`;
    gpxFile.id = id;
    gpxFile.hikeId = hikeId;
    gpxFile.path = path;

    await this.uploadGpxFile(path, file);

    let previousPath: string | null = null;

    try {
      await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(HikeGPX);
        const lastGpxFile = await repository.findOne({ where: { hikeId } });

        if (lastGpxFile) {
          previousPath = lastGpxFile.path;
          await repository.delete(lastGpxFile.id);
        }

        await repository.save(gpxFile);
      });
    } catch (error) {
      await fs.promises
        .unlink(this.resolveManagedGpxPath(path, false))
        .catch(() => undefined);
      throw error;
    }

    if (previousPath) {
      try {
        const previousFile = this.resolveManagedGpxPath(previousPath, false);
        if (fs.existsSync(previousFile)) {
          await fs.promises.unlink(previousFile);
        }
      } catch {
        // La ligne en base est déjà remplacée : conserver un éventuel fichier
        // legacy plutôt que de risquer une suppression hors du répertoire GPX.
      }
    }

    return gpxFile;
  }

  async deleteGpxFile(hikeId: string) {
    const gpxFile = await this.findOne({
      where: { hikeId },
    });
    if (gpxFile) {
      await this.delete(gpxFile.id);
      try {
        const filePath = this.resolveManagedGpxPath(gpxFile.path, false);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch {
        // Ne jamais restaurer une référence cassée ni supprimer hors du volume.
      }
      return true;
    }
    return false;
  }

  private async uploadGpxFile(path: string, file: File) {
    const directoryPath = resolve(config.gpx_path);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    await fs.promises.writeFile(
      this.resolveManagedGpxPath(path, false),
      file.buffer,
    );
  }
}

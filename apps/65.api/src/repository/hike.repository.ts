import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { isAbsolute, relative, resolve } from 'path';
import { config } from 'src/config/config';
import {
  CreateHikeDto,
  HikeSearchDto,
  HikeSuggestionDto,
  UpdateHikeDto,
} from 'src/DTO/hike.dto';
import { Favorite } from 'src/entities/favorite.entity';
import { HikeGPX } from 'src/entities/higeGPX.entity';
import { Image } from 'src/entities/image.entity';
import { DataSource, Like, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Hike } from '../entities/hike.entity';
import { HikeSuggestions } from './hike-suggestions.query';

@Injectable()
export class HikeRepository extends Repository<Hike> {
  private readonly suggestions = new HikeSuggestions(
    (sql) => this.query(sql),
    () => this.dataSource.createQueryRunner().isTransactionActive,
  );

  constructor(private dataSource: DataSource) {
    super(Hike, dataSource.createEntityManager());
  }

  private resolveFileForDeletion(
    root: string,
    storedPath: string,
  ): string | null {
    const absoluteRoot = resolve(root);
    const candidatePath = resolve(absoluteRoot, storedPath);
    const candidateFromRoot = relative(absoluteRoot, candidatePath);

    if (
      !candidateFromRoot ||
      candidateFromRoot.startsWith('..') ||
      isAbsolute(candidateFromRoot) ||
      !fs.existsSync(candidatePath)
    ) {
      return null;
    }

    const realRoot = fs.realpathSync(absoluteRoot);
    const realFilePath = fs.realpathSync(candidatePath);
    const realPathFromRoot = relative(realRoot, realFilePath);

    if (
      !realPathFromRoot ||
      realPathFromRoot.startsWith('..') ||
      isAbsolute(realPathFromRoot) ||
      !fs.statSync(realFilePath).isFile()
    ) {
      return null;
    }

    return realFilePath;
  }

  async findAllWithFilters(filters: HikeSearchDto): Promise<Hike[]> {
    return await this.find({
      where: {
        title: Like(`%${filters.title ?? ''}%`),
        category: {
          id: filters.categoryId,
        },
        state: {
          id: filters.stateId,
        },
      },
      order: {
        title: 'ASC',
      },
      relations: {
        category: true,
        state: true,
        difficulty: true,
        mainImage: true,
      },
      select: {
        id: true,
        title: true,
        difficulty: true,
        mainImage: true,
        category: true,
        state: true,
        elevation: true,
        distance: true,
        duration: true,
      },
    });
  }

  async findSuggestions(term: string): Promise<HikeSuggestionDto[]> {
    return this.suggestions.find(term);
  }

  async getHikeById(id: string): Promise<Hike> {
    return await this.findOne({
      where: { id },
      relations: {
        category: true,
        state: true,
        difficulty: true,
        mainImage: true,
        images: true,
        gpxFiles: true,
      },
      order: {
        images: {
          ordered: 'ASC',
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        indication: true,
        difficulty: true,
        mainImage: true,
        images: true,
        elevation: true,
        distance: true,
        duration: true,
        category: true,
        state: true,
        mainImagePosition: true,
        gpxFiles: true,
      },
    });
  }

  async getHikeWithFavorites(id: string): Promise<Hike[]> {
    return await this.find({
      where: { favorites: { userId: id } },
      relations: {
        favorites: true,
        category: true,
        state: true,
        difficulty: true,
        mainImage: true,
      },
      select: {
        id: true,
        title: true,
        difficulty: true,
        mainImage: true,
        category: true,
        state: true,
        elevation: true,
        distance: true,
        duration: true,
      },
    });
  }

  async isFavorite(hikeId: string, userId: string): Promise<boolean> {
    return this.dataSource.getRepository(Favorite).existsBy({ hikeId, userId });
  }

  async setFavorite(hikeId: string, userId: string, isFavorite: boolean) {
    const favorites = this.dataSource.getRepository(Favorite);
    if (isFavorite) {
      await favorites
        .createQueryBuilder()
        .insert()
        .values({ hikeId, userId })
        .orIgnore()
        .execute();
    } else {
      await favorites.delete({ hikeId, userId });
    }
  }

  async toggleFavorite(hikeId: string, userId: string): Promise<void> {
    const favorite = await this.dataSource.getRepository(Favorite).findOne({
      where: { hikeId, userId },
    });
    if (favorite) {
      await this.dataSource.getRepository(Favorite).delete({ hikeId, userId });
    } else {
      const newFavorite = new Favorite();
      newFavorite.hikeId = hikeId;
      newFavorite.userId = userId;
      await this.dataSource.getRepository(Favorite).save(newFavorite);
    }
  }

  async createHike(hike: CreateHikeDto): Promise<Hike> {
    const newHike = new Hike();
    newHike.id = uuidv4();
    newHike.title = hike.title;
    newHike.difficultyId = hike.difficultyId;
    newHike.stateId = hike.stateId;
    newHike.categoryId = hike.categoryId;
    newHike.mainImagePosition = 0;
    return await this.save(newHike);
  }

  async updateHike(hike: UpdateHikeDto): Promise<Hike> {
    const { id, ...updateData } = hike;

    // Filtre les valeurs undefined
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined),
    );

    const result = await this.update(id, cleanUpdateData);

    if (result.affected === 0) {
      throw new NotFoundException('Hike not found');
    }

    return await this.findOne({ where: { id } });
  }

  async deleteHike(id: string): Promise<void> {
    const hike = await this.findOne({ where: { id } });
    if (!hike) {
      throw new NotFoundException('Hike not found');
    }
    const images = await this.dataSource.getRepository(Image).find({
      where: { hikeId: id },
    });
    const gpxFiles = await this.dataSource.getRepository(HikeGPX).find({
      where: { hikeId: id },
    });

    await this.delete(id);

    for (const image of images) {
      try {
        const filePath = this.resolveFileForDeletion(
          config.image_path,
          image.path,
        );
        if (filePath) {
          await fs.promises.unlink(filePath);
        }
      } catch (error) {
        console.error('Error deleting image', error);
      }
    }
    for (const gpxFile of gpxFiles) {
      try {
        const filePath = this.resolveFileForDeletion(
          config.gpx_path,
          gpxFile.path,
        );
        if (filePath) {
          await fs.promises.unlink(filePath);
        }
      } catch (error) {
        console.error('Error deleting gpx file', error);
      }
    }
    return;
  }
}

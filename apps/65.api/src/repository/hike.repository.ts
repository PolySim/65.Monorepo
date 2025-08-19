import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { config } from 'src/config/config';
import { CreateHikeDto, HikeSearchDto, UpdateHikeDto } from 'src/DTO/hike.dto';
import { Favorite } from 'src/entities/favorite.entity';
import { HikeGPX } from 'src/entities/higeGPX.entity';
import { Image } from 'src/entities/image.entity';
import { DataSource, Like, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Hike } from '../entities/hike.entity';

@Injectable()
export class HikeRepository extends Repository<Hike> {
  constructor(private dataSource: DataSource) {
    super(Hike, dataSource.createEntityManager());
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

    for (const image of images) {
      try {
        await fs.promises.unlink(`${config.image_path}/${image.path}`);
      } catch (error) {
        console.error('Error deleting image', error);
      }
    }
    for (const gpxFile of gpxFiles) {
      try {
        await fs.promises.unlink(`${config.gpx_path}/${gpxFile.path}`);
      } catch (error) {
        console.error('Error deleting gpx file', error);
      }
    }
    await this.delete(id);
    return;
  }
}

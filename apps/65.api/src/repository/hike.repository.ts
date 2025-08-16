import { Injectable } from '@nestjs/common';
import { CreateHikeDto, HikeSearchDto } from 'src/DTO/hike.dto';
import { Favorite } from 'src/entities/favorite.entity';
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
}

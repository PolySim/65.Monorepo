import { Injectable } from '@nestjs/common';
import { HikeSearchDto } from 'src/DTO/hike.dto';
import { DataSource, Like, Repository } from 'typeorm';
import { Hike } from '../entities/hike.entity';

@Injectable()
export class HikeRepository extends Repository<Hike> {
  constructor(private dataSource: DataSource) {
    super(Hike, dataSource.createEntityManager());
  }

  async findAllWithFilters(filters: HikeSearchDto): Promise<Hike[]> {
    return await this.find({
      where: {
        title: Like(`%${filters.title}%`),
      },
      relations: {
        category: true,
        state: true,
      },
      select: {
        id: true,
        title: true,
        category: true,
        state: true,
      },
    });
  }
}

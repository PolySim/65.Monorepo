import { Injectable } from '@nestjs/common';
import { HikeSearchDto } from 'src/DTO/hike.dto';
import { Hike } from 'src/entities/hike.entity';
import { HikeRepository } from 'src/repository/hike.repository';

@Injectable()
export class HikeService {
  constructor(private readonly hikeRepository: HikeRepository) {}

  async findAllWithFilters(filters: HikeSearchDto): Promise<Hike[]> {
    return this.hikeRepository.findAllWithFilters(filters);
  }

  async getHikeById(id: string): Promise<Hike> {
    return this.hikeRepository.getHikeById(id);
  }
}

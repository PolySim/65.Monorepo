import { Injectable } from '@nestjs/common';
import { CreateHikeDto, HikeSearchDto, UpdateHikeDto } from 'src/DTO/hike.dto';
import { Hike } from 'src/entities/hike.entity';
import { HikeRepository } from 'src/repository/hike.repository';
import { UserRepository } from 'src/repository/user.repository';

@Injectable()
export class HikeService {
  constructor(
    private readonly hikeRepository: HikeRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async findAllWithFilters(filters: HikeSearchDto): Promise<Hike[]> {
    return this.hikeRepository.findAllWithFilters(filters);
  }

  async getHikeById(id: string): Promise<Hike> {
    return this.hikeRepository.getHikeById(id);
  }

  async getHikeWithFavorites(subId: string): Promise<Hike[]> {
    const user = await this.userRepository.findBySubId(subId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.hikeRepository.getHikeWithFavorites(user.id);
  }

  async toggleFavorite(hikeId: string, subId: string): Promise<void> {
    const user = await this.userRepository.findBySubId(subId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.hikeRepository.toggleFavorite(hikeId, user.id);
  }

  async createHike(hike: CreateHikeDto): Promise<Hike> {
    return this.hikeRepository.createHike(hike);
  }

  async updateHike(hike: UpdateHikeDto): Promise<Hike> {
    return this.hikeRepository.updateHike(hike);
  }
}

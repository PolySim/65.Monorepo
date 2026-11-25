import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateHikeDto,
  HIKE_SUGGESTION_MAX_LENGTH,
  HikeFavoriteStatusDto,
  HikeSearchDto,
  HikeSuggestionDto,
  UpdateHikeDto,
} from 'src/DTO/hike.dto';
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

  async findSuggestions(query: unknown): Promise<HikeSuggestionDto[]> {
    if (
      typeof query !== 'string' ||
      query.length > HIKE_SUGGESTION_MAX_LENGTH
    ) {
      throw new BadRequestException(
        `q doit être une chaîne de ${HIKE_SUGGESTION_MAX_LENGTH} caractères maximum`,
      );
    }
    const term = query.trim();
    return term.length < 2 ? [] : this.hikeRepository.findSuggestions(term);
  }

  async getHikeById(id: string): Promise<Hike> {
    return this.hikeRepository.getHikeById(id);
  }

  async getHikeWithFavorites(authUserId: string): Promise<Hike[]> {
    const user = await this.userRepository.findByAuthUserId(authUserId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.hikeRepository.getHikeWithFavorites(user.id);
  }

  private async getFavoriteUserId(hikeId: string, authUserId: string) {
    const user = await this.userRepository.findByAuthUserId(authUserId);
    if (!user) {
      throw new ForbiddenException('User not linked');
    }
    if (!(await this.hikeRepository.existsBy({ id: hikeId }))) {
      throw new NotFoundException('Hike not found');
    }
    return user.id;
  }

  async getFavoriteStatus(
    hikeId: string,
    authUserId: string,
  ): Promise<HikeFavoriteStatusDto> {
    const userId = await this.getFavoriteUserId(hikeId, authUserId);
    return { isFavorite: await this.hikeRepository.isFavorite(hikeId, userId) };
  }

  async setFavorite(
    hikeId: string,
    authUserId: string,
    isFavorite: boolean,
  ): Promise<HikeFavoriteStatusDto> {
    const userId = await this.getFavoriteUserId(hikeId, authUserId);
    await this.hikeRepository.setFavorite(hikeId, userId, isFavorite);
    return { isFavorite };
  }

  async toggleFavorite(hikeId: string, authUserId: string): Promise<void> {
    const user = await this.userRepository.findByAuthUserId(authUserId);
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

  async deleteHike(id: string): Promise<void> {
    return this.hikeRepository.deleteHike(id);
  }
}

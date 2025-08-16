import { Injectable } from '@nestjs/common';
import { DifficultyRepository } from '../repository/difficulty.repository';
import { Difficulty } from 'src/entities/difficulty.entity';

@Injectable()
export class DifficultyService {
  constructor(private readonly difficultyRepository: DifficultyRepository) {}

  async findAll(): Promise<Difficulty[]> {
    return await this.difficultyRepository.findAll();
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Difficulty } from '../entities/difficulty.entity';

@Injectable()
export class DifficultyRepository extends Repository<Difficulty> {
  constructor(private dataSource: DataSource) {
    super(Difficulty, dataSource.createEntityManager());
  }

  async findAll(): Promise<Difficulty[]> {
    return await this.find();
  }
}

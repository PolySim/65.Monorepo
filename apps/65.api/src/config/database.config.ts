import { Category } from 'src/entities/category.entity';
import { Difficulty } from 'src/entities/difficulty.entity';
import { Hike } from 'src/entities/hike.entity';
import { Image } from 'src/entities/image.entity';
import { State } from 'src/entities/state.entity';
import { User } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/userRole.entity';
import { config } from './config';
import { HikeGPX } from 'src/entities/higeGPX.entity';

export const databaseConfig = {
  type: 'sqlite' as const,
  database: config.database_path,
  entities: [User, UserRole, Category, State, Hike, Difficulty, Image, HikeGPX],
  synchronize: false,
  logging: true,
};

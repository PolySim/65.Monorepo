import { Category } from 'src/entities/category.entity';
import { State } from 'src/entities/state.entity';
import { User } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/userRole.entity';
import { config } from './config';

export const databaseConfig = {
  type: 'sqlite' as const,
  database: config.database_path,
  entities: [User, UserRole, Category, State],
  synchronize: false,
  logging: true,
};

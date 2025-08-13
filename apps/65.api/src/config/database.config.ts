import { User } from 'src/entities/user.entity';
import { config } from './config';
import { UserRole } from 'src/entities/userRole.entity';

export const databaseConfig = {
  type: 'sqlite' as const,
  database: config.database_path,
  entities: [User, UserRole],
  synchronize: false,
  logging: true,
};

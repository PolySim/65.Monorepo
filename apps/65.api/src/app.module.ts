import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { CategoryController } from './controllers/category.controller';
import { HikeController } from './controllers/hike.controller';
import { ImageController } from './controllers/image.controller';
import { UserController } from './controllers/user.controller';
import { CategoryRepository } from './repository/category.repository';
import { HikeRepository } from './repository/hike.repository';
import { ImageRepository } from './repository/image.repository';
import { UserRepository } from './repository/user.repository';
import { CategoryService } from './services/category.service';
import { HikeService } from './services/hike.service';
import { ImageService } from './services/image.service';
import { UserService } from './services/user.service';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig)],
  controllers: [
    AppController,
    UserController,
    CategoryController,
    ImageController,
    HikeController,
  ],
  providers: [
    AppService,
    UserService,
    UserRepository,
    CategoryService,
    CategoryRepository,
    ImageService,
    ImageRepository,
    HikeService,
    HikeRepository,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { CategoryController } from './controllers/category.controller';
import { GpxController } from './controllers/gpx.controller';
import { HikeController } from './controllers/hike.controller';
import { ImageController } from './controllers/image.controller';
import { UserController } from './controllers/user.controller';
import { CategoryRepository } from './repository/category.repository';
import { HikeRepository } from './repository/hike.repository';
import { ImageRepository } from './repository/image.repository';
import { UserRepository } from './repository/user.repository';
import { CategoryService } from './services/category.service';
import { GpxService } from './services/gpx.service';
import { HikeService } from './services/hike.service';
import { ImageService } from './services/image.service';
import { UserService } from './services/user.service';
import { GpxRepository } from './repository/gpx.repository';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig)],
  controllers: [
    AppController,
    UserController,
    CategoryController,
    ImageController,
    HikeController,
    GpxController,
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
    GpxService,
    GpxRepository,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { CategoryController } from './controllers/category.controller';
import { UserController } from './controllers/user.controller';
import { CategoryRepository } from './repository/category.repository';
import { UserRepository } from './repository/user.repository';
import { CategoryService } from './services/category.service';
import { UserService } from './services/user.service';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig)],
  controllers: [AppController, UserController, CategoryController],
  providers: [
    AppService,
    UserService,
    UserRepository,
    CategoryService,
    CategoryRepository,
  ],
})
export class AppModule {}

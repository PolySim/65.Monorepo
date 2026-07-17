import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { auth } from './auth';
import { config as conf } from './config/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.all('/api/auth/*', toNodeHandler(auth));

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('65.API')
    .setDescription('API NestJS avec SQLite et TypeORM')
    .setVersion('1.0')
    .addTag('api')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  await app.listen(conf.port);
}
bootstrap();

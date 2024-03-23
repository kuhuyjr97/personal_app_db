import {
  INestApplication,
  ValidationPipe,
  type NestApplicationOptions,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { AppModule } from '@/modules/app/app.module';

const setUpSwagger = (app: INestApplication<any>) => {
  const basicAuth = require('express-basic-auth');
  app.use(
    ['/api/docs'],
    basicAuth({
      challenge: true,
      users: { test: 'test' },
    }),
  );

  const options = new DocumentBuilder()
    // .addServer('https://')
    .addServer('http://localhost:3000')
    .setTitle('GTN-Affiliate API')
    .addBearerAuth({ in: 'header', type: 'http' })
    .addBearerAuth({ in: 'header', type: 'http' }, 'Google')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  if (process.env.APP_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document);
  }
};

const bootstrap = async () => {
  //
  const config: NestApplicationOptions = {
    bufferLogs: true,
    cors: true,
  };
  const app = await NestFactory.create(AppModule, config);

  //
  setUpSwagger(app);

  //
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  //
  app.useLogger(app.get(Logger));

  await app.listen(3000);
};
bootstrap();

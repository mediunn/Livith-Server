import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import { AppModuleV4 } from './v4/app.module';
import { AppModule } from './v5/app.module';
import { GlobalExceptionFilter as GlobalExceptionFilterV4 } from './v4/common/filters/global-exception.filter';
import { GlobalExceptionFilter as GlobalExceptionFilterV5 } from './v5/common/filters/global-exception.filter';

const CORS_ORIGINS = [
  'http://localhost:5173',
  'https://www.livith.site',
  'https://staging.livith.site',
];

async function bootstrapLegacy() {
  const app = await NestFactory.create(AppModuleV4);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors
          .map((err) => (err.constraints ? Object.values(err.constraints) : []))
          .flat();
        return new BadRequestException(messages.join(', '));
      },
    }),
  );
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilterV4());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'default_secret',
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.enableCors({ origin: CORS_ORIGINS, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Livith API v4 문서')
    .setDescription('Livith API v4 문서입니다.')
    .setVersion('4.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT_LEGACY || 3000);
  console.log(`Legacy (v4) server running on port ${process.env.PORT_LEGACY || 3000}`);
}

async function bootstrapNext() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors
          .map((err) => (err.constraints ? Object.values(err.constraints) : []))
          .flat();
        return new BadRequestException(messages.join(', '));
      },
    }),
  );
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilterV5());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'default_secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.enableCors({ origin: CORS_ORIGINS, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Livith API v5 문서')
    .setDescription('Livith API v5 문서입니다.')
    .setVersion('5.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT || 4000);
  console.log(`Next (v5) server running on port ${process.env.PORT || 4000}`);
}

Promise.all([bootstrapLegacy(), bootstrapNext()]).catch((err) => {
  console.error('Failed to start servers:', err);
  process.exit(1);
});

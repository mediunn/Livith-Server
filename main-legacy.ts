import { NestFactory } from '@nestjs/core';
import { AppModuleV4 } from './src/v4/app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './src/v4/common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModuleV4);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors
          .map((err) => {
            if (err.constraints) {
              return Object.values(err.constraints);
            }
            return [];
          })
          .flat();
        return new BadRequestException(messages.join(', '));
      },
    }),
  );
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'default_secret',
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://www.livith.site',
      'https://staging.livith.site',
    ],
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('Livith API v4 문서')
    .setDescription('Livith API v4 문서입니다.')
    .setVersion('4.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

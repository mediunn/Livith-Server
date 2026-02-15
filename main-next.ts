import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/v5/app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './src/v5/common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  await app.listen(process.env.PORT || 4000);
}
bootstrap();

import { webcrypto } from 'crypto';

if (!(global as any).crypto) {
  (global as any).crypto = webcrypto;
}
import './tracing';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import session from 'express-session';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ExternalApiMetricsService } from './metrics/external-api-metrics.service';
import axios from 'axios';
import { HttpService } from '@nestjs/axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const apiMetrics = app.get(ExternalApiMetricsService);
  apiMetrics.attach(axios); // kakao / apple
  apiMetrics.attach(app.get(HttpService).axiosRef); // lastfm / spotify / youtube

  // Winston을 NestJS 기본 로거로 교체
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        // errors는 ValidationError[] 타입
        const messages = errors
          .map((err) => {
            if (err.constraints) {
              return Object.values(err.constraints);
            }
            return [];
          })
          .flat();
        return new BadRequestException(messages.join(', ')); // 배열을 문자열로 합침
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
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: process.env.NODE_ENV === 'production',
      }, // 1일
    }),
  );
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const config = new DocumentBuilder()
    .setTitle('Livith API 문서')
    .setDescription('Livith API 문서입니다.')
    .setVersion('6.0')
    .addBearerAuth() // JWT 인증 추가
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('api-docs', app, document);

  const defaultAllowedOrigins = [
    'http://localhost:5173',
    'https://www.livith.site',
    'https://staging.livith.site',
  ];

  const allowedOrigins = Array.from(
    new Set(
      (process.env.FRONTEND_URLS?.split(',') ?? [])
        .map((origin) => origin?.trim())
        .filter((origin): origin is string =>
          Boolean(origin && origin.length > 0),
        ),
    ),
  );

  //cors 설정
  app.enableCors({
    origin: allowedOrigins.length ? allowedOrigins : defaultAllowedOrigins,
    credentials: true, // 자격 정보 허용
  });

  await app.listen(process.env.PORT || 4000);

  //직접 호출
  // const openApiService = app.get(OpenApiService);
  // await openApiService.handleDailyUpdate();

  // const concertService = app.get(ConcertSchedulerService);
  // await concertService.handleSortedIndexUpdate();
}
bootstrap();

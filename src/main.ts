import { NestFactory } from '@nestjs/core';
// import { AppModuleV1 } from './v1/app.module';
// import { AppModuleV2 } from './v2/app.module';
// import { AppModuleV3 } from './v3/app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModuleV4 } from './v4/app.module';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from './v4/common/filters/global-exception.filter';
import session from 'express-session';

// import { ConcertSchedulerService } from './concert/concert-scheduler.service';
// import { OpenApiService } from './open-api/open-api.service';

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

  const config = new DocumentBuilder()
    .setTitle('Livith API 문서')
    .setDescription('Livith API 문서입니다.')
    .setVersion('4.0')
    .addBearerAuth() // JWT 인증 추가
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  //cors 설정
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://www.livith.site',
      'https://staging.livith.site',
    ], // 클라이언트 주소 정확히 명시
    credentials: true, // 자격 정보 허용
  });

  await app.listen(3000);

  //직접 호출
  // const openApiService = app.get(OpenApiService);
  // await openApiService.handleDailyUpdate();

  // const concertService = app.get(ConcertSchedulerService);
  // await concertService.handleSortedIndexUpdate();
}
bootstrap();

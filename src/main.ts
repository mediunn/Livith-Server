import { NestFactory } from '@nestjs/core';
// import { AppModuleV1 } from './v1/app.module';
// import { AppModuleV2 } from './v2/app.module';
// import { AppModuleV3 } from './v3/app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModuleV4 } from './v4/app.module';
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
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Livith API 문서')
    .setDescription('Livith API 문서입니다.')
    .setVersion('2.0')
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

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import { ConcertSchedulerService } from './concert/concert-scheduler.service';
// import { OpenApiService } from './open-api/open-api.service';

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
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Livith API 문서')
    .setDescription('Livith API 문서입니다.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  //cors 설정
  app.enableCors(); // 모두 허용

  await app.listen(3000);

  //직접 호출
  // const openApiService = app.get(OpenApiService);
  // await openApiService.handleDailyUpdate();

  // const concertService = app.get(ConcertSchedulerService);
  // await concertService.handleSortedIndexUpdate();
}
bootstrap();

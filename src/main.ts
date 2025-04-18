import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { OpenApiService } from './open-api/open-api.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  //직접 호출
  // const openApiService = app.get(OpenApiService);
  // await openApiService.handleDailyUpdate();
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CultureUploadService } from './culture-upload.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cultureService = app.get(CultureUploadService);

  await cultureService.uploadCulturesFromCSV('csv/cultures.csv');

  await app.close();
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CultureUploadService } from './culture-upload.service';
import { SetlistUploadService } from './setlist-upload.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cultureService = app.get(CultureUploadService);
  const setlistService = app.get(SetlistUploadService);

  await cultureService.uploadCulturesFromCSV('csv/cultures.csv');
  await setlistService.uploadSetlistsFromCSV('csv/setlists.csv');

  await app.close();
}

bootstrap();

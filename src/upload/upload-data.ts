import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CultureUploadService } from './culture-upload.service';
import { SetlistUploadService } from './setlist-upload.service';
import { ConcertSetlistUploadService } from './concert-setlist-upload.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cultureService = app.get(CultureUploadService);
  const setlistService = app.get(SetlistUploadService);
  const concertSetlistService = app.get(ConcertSetlistUploadService);

  await cultureService.uploadCulturesFromCSV('csv/cultures.csv');
  await setlistService.uploadSetlistsFromCSV('csv/setlists.csv');
  await concertSetlistService.uploadConcertSetlistsFromCSV(
    'csv/concert_setlists.csv',
  );

  await app.close();
}

bootstrap();

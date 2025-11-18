import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';

@Injectable()
export class SongUploadService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadSongsFromCSV(filePath: string) {
    const records = [];
    const csvFilePath = path.join(__dirname, filePath);

    const normalizeKeys = (obj: Record<string, any>) =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.trim().replace(/^"|"$/g, ''),
          value.trim(),
        ]),
      );

    return new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (rawRow) => {
          const row = normalizeKeys(rawRow);
          records.push(row);
        })
        .on('end', async () => {
          try {
            for (const row of records) {
              const {
                title,
                artist,
                img_url,
                lyrics,
                pronunciation,
                translation,
              } = row;

              const existingSong = await this.prisma.song.findFirst({
                where: {
                  title,
                  artist,
                },
              });

              if (existingSong) {
                console.log(`Skipping duplicate: "${title}" by ${artist}`);
                continue;
              }

              await this.prisma.song.create({
                data: {
                  title,
                  artist,
                  imgUrl: img_url,
                  lyrics,
                  pronunciation,
                  translation,
                },
              });

              console.log(`Inserted: "${title}" by ${artist}`);
            }

            console.log('Songs upload completed.');
            resolve();
          } catch (error) {
            console.error('Error inserting songs:', error);
            reject(error);
          }
        })
        .on('error', (err) => {
          console.error('CSV read error:', err);
          reject(err);
        });
    });
  }
}

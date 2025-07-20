import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';

@Injectable()
export class SetlistUploadService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadSetlistsFromCSV(filePath: string) {
    const records = [];

    const csvFilePath = path.join(__dirname, filePath);
    const normalizeKeys = (obj: Record<string, any>) =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.trim().replace(/^"|"$/g, ''),
          value?.trim(),
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
            const existing = await this.prisma.setlist.findMany({
              select: { title: true, date: true },
            });

            const existingSet = new Set(
              existing.map((e) => `${e.title}_${e.date}`),
            );

            for (const set of records) {
              const { title, date, img_url, artist } = set;

              const uniqueKey = `${title}_${date}`;
              if (existingSet.has(uniqueKey)) {
                console.log(`Skipped duplicate: ${uniqueKey}`);
                continue;
              }

              await this.prisma.setlist.create({
                data: {
                  title,
                  date: date,
                  imgUrl: img_url,
                  artist,
                },
              });
              console.log(`Inserted: ${title}`);
            }

            console.log('Setlist data upload completed.');
            resolve();
          } catch (error) {
            console.error('Error inserting setlists:', error);
            reject(error);
          }
        })
        .on('error', (err) => {
          console.error('Error reading CSV file:', err);
          reject(err);
        });
    });
  }
}

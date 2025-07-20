import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';

@Injectable()
export class ConcertSetlistUploadService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadConcertSetlistsFromCSV(filePath: string) {
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
              const concertId = Number(row.concert_id);
              const setlistTitle = row.setlist_title;
              const setlistDate = row.setlist_date;
              const setlist = await this.prisma.setlist.findFirst({
                where: {
                  title: setlistTitle,
                  date: setlistDate,
                },
              });

              if (!setlist) {
                console.warn(
                  `Setlist not found: ${setlistTitle} (${row.setlist_date})`,
                );
                continue;
              }

              // 중복 확인
              const existing = await this.prisma.concertSetlist.findFirst({
                where: {
                  concertId: concertId,
                  setlistId: setlist.id,
                },
              });

              if (existing) {
                console.log(
                  `Skipping duplicate: concertId=${concertId}, setlistId=${setlist.id}`,
                );
                continue;
              }

              await this.prisma.concertSetlist.create({
                data: {
                  concertId,
                  setlistId: setlist.id,
                  type: row.type,
                  status: row.status,
                },
              });

              console.log(
                `Inserted: concertId=${concertId}, setlistId=${setlist.id}`,
              );
            }

            console.log('concert_setlists upload completed.');
            resolve();
          } catch (error) {
            console.error('Error inserting concert_setlists:', error);
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

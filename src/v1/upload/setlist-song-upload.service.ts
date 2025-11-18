import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';

@Injectable()
export class SetlistSongsUploadService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadSetlistSongsFromCSV(filePath: string) {
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
              const setlistTitle = row.setlist_title;
              const setlistDate = row.setlist_date;
              const songTitle = row.song_title;
              const songArtist = row.song_artist;
              const orderIndex = Number(row.order_index);
              const fanchant = row.fanchant || null;

              const setlist = await this.prisma.setlist.findFirst({
                where: {
                  title: setlistTitle,
                  date: setlistDate,
                },
              });

              if (!setlist) {
                console.warn(
                  `Setlist not found: ${setlistTitle} (${setlistDate})`,
                );
                continue;
              }

              const song = await this.prisma.song.findFirst({
                where: {
                  title: songTitle,
                  artist: songArtist,
                },
              });

              if (!song) {
                console.warn(`Song not found: ${songTitle} by ${songArtist}`);
                continue;
              }

              const existing = await this.prisma.setlistSong.findFirst({
                where: {
                  setlistId: setlist.id,
                  songId: song.id,
                },
              });

              if (existing) {
                console.log(
                  `Skipping duplicate: setlistId=${setlist.id}, songId=${song.id}`,
                );
                continue;
              }

              await this.prisma.setlistSong.create({
                data: {
                  setlistId: setlist.id,
                  songId: song.id,
                  orderIndex,
                  fanchant,
                },
              });

              console.log(
                `Inserted: setlistId=${setlist.id}, songId=${song.id}`,
              );
            }

            console.log('setlist_songs upload completed.');
            resolve();
          } catch (error) {
            console.error('Error inserting setlist_songs:', error);
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

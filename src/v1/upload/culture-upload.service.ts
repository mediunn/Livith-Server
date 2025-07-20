import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';

@Injectable()
export class CultureUploadService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadCulturesFromCSV(filePath: string) {
    const records = [];

    const csvFilePath = path.join(__dirname, filePath); // 파일 경로 맞게 수정
    const normalizeKeys = (obj: Record<string, any>) =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.trim().replace(/^"|"$/g, ''),
          value,
        ]),
      );
    return new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (rawRow) => {
          const row = normalizeKeys(rawRow); // 키를 'concert_id' → concert_id로 정리
          records.push(row);
        })
        .on('end', async () => {
          try {
            for (const culture of records) {
              const concertId = Number(culture.concert_id?.trim());

              if (isNaN(concertId)) {
                console.error(`Invalid concert_id: ${culture.concert_id}`);
                continue;
              }

              await this.prisma.culture.create({
                data: {
                  concertId: concertId,
                  content: culture.content,
                  imgUrl: culture.img_url,
                },
              });
            }
            console.log('Culture data upload completed.');
            resolve();
          } catch (error) {
            console.error('Error inserting cultures:', error);
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

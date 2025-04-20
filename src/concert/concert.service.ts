import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertStatus } from 'src/common/enums/concert-status.enum';

@Injectable()
export class ConcertService {
  constructor(private readonly prismaService: PrismaService) {}
  async getConcerts(status: ConcertStatus, cursor?: number, size?: number) {
    const concertLists = await this.prismaService.concert.findMany({
      where: {
        status: status,
      },
      take: size,
      skip: cursor ? 1 : 0, // cursor가 있을 때만 건너뛰기
      cursor: cursor ? { id: cursor } : undefined,
    });
    return concertLists;
  }
}

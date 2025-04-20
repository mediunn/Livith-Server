import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertStatus } from 'src/common/enums/concert-status.enum';
import { getDaysUntil } from 'src/common/utils/date.util';

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

    // daysLeft 계산
    const concertsWithDaysLeft = concertLists.map((concert) => ({
      ...concert,
      daysLeft: getDaysUntil(concert.startDate),
    }));

    return concertsWithDaysLeft;
  }
}

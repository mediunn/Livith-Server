import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertStatus } from 'src/common/enums/concert-status.enum';
import { getDaysUntil } from 'src/common/utils/date.util';
import { ConcertResponseDto } from './dto/concert-response.dto';

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
      orderBy: { sortedIndex: 'asc' },
    });

    // daysLeft 계산
    const concertsWithDaysLeft = concertLists.map((concert) => ({
      ...concert,
      daysLeft: getDaysUntil(concert.startDate),
    }));

    return concertsWithDaysLeft.map(
      (concert) => new ConcertResponseDto(concert),
    );
  }

  async getConcertDetails(id: number) {
    const concert = await this.prismaService.concert.findUnique({
      where: {
        id: id,
      },
    });

    // 콘서트가 없을 경우 예외 처리
    if (!concert) {
      throw new NotFoundException(`해당 콘서트를 찾을 수 없습니다.`);
    }

    const concertWithDaysLeft = {
      ...concert,
      daysLeft: getDaysUntil(concert.startDate),
    };
    return new ConcertResponseDto(concertWithDaysLeft);
  }
}

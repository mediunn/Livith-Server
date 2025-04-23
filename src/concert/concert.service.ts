import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertStatus } from 'src/common/enums/concert-status.enum';
import { getDaysUntil } from 'src/common/utils/date.util';
import { ConcertResponseDto } from './dto/concert-response.dto';
import { CultureResponseDto } from './dto/culture-response.dto';

@Injectable()
export class ConcertService {
  constructor(private readonly prismaService: PrismaService) {}
  // 콘서트 목록 조회
  async getConcerts(status: ConcertStatus, cursor?: number, size?: number) {
    const concertLists = await this.prismaService.concert.findMany({
      where: {
        status: status,
      },
      take: size,
      skip: cursor ? 1 : 0, // cursor가 있을 때만 건너뛰기
      cursor: cursor ? { sortedIndex: cursor } : undefined,
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

  // 콘서트 상세 조회
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

  // 콘서트에 해당하는 문화 조회
  async getConcertCulture(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    // 문화 조회
    const cultures = await this.prismaService.culture.findMany({
      where: {
        concertId: id,
      },
    });

    return cultures.map((culture) => new CultureResponseDto(culture));
  }
}

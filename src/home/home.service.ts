import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { HomeSectionResponseDto } from './dto/home-section-response.dto';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  // 홈 화면 섹션 정보 조회
  async getHomeSections() {
    const sections = await this.prisma.homeSection.findMany({
      include: {
        homeConcertSections: {
          orderBy: {
            sortedIndex: 'asc',
          },
          include: {
            concert: true,
          },
        },
      },
    });
    return sections.map((section) => new HomeSectionResponseDto(section));
  }
}

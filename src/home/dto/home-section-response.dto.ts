import { Concert, HomeConcertSection, HomeSection } from '@prisma/client';
import { getConcertDaysLeft } from 'src/common/utils/date.util';

export class HomeSectionResponseDto {
  id: number;
  sectionTitle: string;
  sortedIndex: number;
  concerts: (Concert & { sortedIndex: number; daysLeft: number | null })[];

  constructor(
    section: HomeSection & {
      homeConcertSections: (HomeConcertSection & { concert: Concert })[];
    },
  ) {
    this.id = section.id;
    this.sectionTitle = section.sectionTitle;
    this.concerts = section.homeConcertSections.map((hcs) => ({
      ...hcs.concert,
      sortedIndex: hcs.sortedIndex,
      daysLeft: getConcertDaysLeft(hcs.concert.startDate, hcs.concert.endDate),
    }));
  }
}

import { Concert, SearchConcertSection, SearchSection } from '@prisma/client';
import { getDaysUntil } from 'src/v3/common/utils/date.util';

export class SearchSectionResponseDto {
  id: number;
  sectionTitle: string;
  sortedIndex: number;
  concerts: (Concert & { sortedIndex: number })[];
  daysLeft: number;

  constructor(
    section: SearchSection & {
      searchConcertSections: (SearchConcertSection & { concert: Concert })[];
    },
  ) {
    this.id = section.id;
    this.sectionTitle = section.sectionTitle;
    this.concerts = section.searchConcertSections.map((hcs) => ({
      ...hcs.concert,
      sortedIndex: hcs.sortedIndex,
      daysLeft: getDaysUntil(hcs.concert.startDate),
    }));
  }
}

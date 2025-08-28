import { Concert, SearchConcertSection, SearchSection } from '@prisma/client';

export class SearchSectionResponseDto {
  id: number;
  sectionTitle: string;
  sortedIndex: number;
  concerts: (Concert & { sortedIndex: number })[];

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
    }));
  }
}

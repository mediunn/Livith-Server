import { Concert, HomeConcertSection, HomeSection } from '@prisma/client';

export class HomeSectionResponseDto {
  id: number;
  sectionTitle: string;
  sortedIndex: number;
  concerts: (Concert & { sortedIndex: number })[];

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
    }));
  }
}

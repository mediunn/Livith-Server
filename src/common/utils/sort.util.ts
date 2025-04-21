import { ConcertStatus } from '../enums/concert-status.enum';
import { Prisma } from '@prisma/client';

//콘서트 정렬
export function getConcertOrderByForStatus(
  status: ConcertStatus,
): Prisma.ConcertOrderByWithRelationInput[] {
  if (status === ConcertStatus.UPCOMING) {
    return [{ startDate: 'asc' }, { title: 'asc' }];
  } else if (status === ConcertStatus.ONGOING) {
    return [{ title: 'asc' }];
  } else if (status === ConcertStatus.COMPLETED) {
    return [{ startDate: 'desc' }, { title: 'asc' }];
  }
  return [];
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsEnum } from 'class-validator';
import { RequestScheduleType } from '../enum/request-schedule-type.enum';
import { ConcertType } from '../enum/concert-type.enum';

export class GetDailyEventsDto {
  @ApiProperty({
    description: '조회할 날짜 (YYYY-MM-DD)',
    example: '2026-07-13',
  })
  @IsDateString({}, { message: 'date는 YYYY-MM-DD 형식이어야 해요' })
  date: string;

  @ApiProperty({
    description: '조회할 일정 타입',
    example: ['CONCERT', 'TICKETING'],
    isArray: true,
    enum: RequestScheduleType,
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (value === undefined || value === null || value === '') {
      return [];
    }

    return [value];
  })
  @IsArray()
  @IsEnum(RequestScheduleType, {
    each: true,
    message: 'scheduleTypes는 CONCERT | TICKETING 중 하나여야 해요',
  })
  scheduleTypes: RequestScheduleType[];

  @ApiProperty({
    description: '조회할 콘서트 필터',
    example: 'ALL',
    enum: ConcertType,
  })
  @IsEnum(ConcertType, {
    message: 'concertType는 ALL | INTEREST 중 하나여야 해요',
  })
  concertType: ConcertType;
}

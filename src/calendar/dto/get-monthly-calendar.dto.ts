import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsEnum } from 'class-validator';
import { ConcertType } from '../enum/concert-type.enum';
import { RequestScheduleType } from '../enum/request-schedule-type.enum';

export class GetMonthlyCalendarDto {
  @ApiProperty({
    description: '조회 시작 날짜 (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsDateString({}, { message: 'startDate는 YYYY-MM-DD 형식이어야 해요' })
  startDate: string;

  @ApiProperty({
    description: '조회 종료 날짜 (YYYY-MM-DD)',
    example: '2026-01-31',
  })
  @IsDateString({}, { message: 'endDate는 YYYY-MM-DD 형식이어야 해요' })
  endDate: string;

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

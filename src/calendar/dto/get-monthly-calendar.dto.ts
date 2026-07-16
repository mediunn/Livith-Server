import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsInt, Max, Min } from 'class-validator';
import { ConcertType } from '../enum/concert-type.enum';
import { RequestScheduleType } from '../enum/request-schedule-type.enum';

export class GetMonthlyCalendarDto {
  @ApiProperty({
    description: '조회할 연도',
    example: 2026,
  })
  @IsInt()
  @Min(1900, {
    message: 'year는 1900 이상의 값이어야 해요',
  })
  @Max(2100, {
    message: 'year는 2100 이하의 값이어야 해요',
  })
  year: number;

  @ApiProperty({
    description: '조회할 월 (1~12)',
    example: 5,
  })
  @IsInt()
  @Min(1, { message: 'month는 1~12 사이의 값이어야 해요' })
  @Max(12, { message: 'month는 1~12 사이의 값이어야 해요' })
  month: number;

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

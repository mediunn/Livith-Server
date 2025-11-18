import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ConcertSort } from 'src/v4/common/enums/concert-sort.enum';
import { ConcertStatus } from 'src/v4/common/enums/concert-status.enum';
import { ConcertGenre } from 'src/v4/common/enums/concert-genre.enum';

export class GetSearchResultsDto {
  @ApiProperty({
    description: '장르',
    isArray: true,
    default: 'ALL',
    enum: ConcertGenre,
    enumName: 'ConcertGenre',

    required: false,
    example: ['JPOP', 'ROCK_METAL'],
  })
  @IsEnum(ConcertGenre, {
    each: true,
    message:
      'genre는 JPOP | ROCK_METAL | RAP_HIPHOP | CLASSIC_JAZZ | ACOUSTIC | ELECTRONIC | ALL 중 하나여야 해요',
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  genre?: ConcertGenre[];

  @ApiProperty({
    description: '진행 상태',
    isArray: true,
    default: 'ALL',
    enum: ConcertStatus,
    enumName: 'ConcertStatus',
    required: false,
    example: 'ALL',
  })
  @IsEnum(ConcertStatus, {
    each: true,
    message: 'status는 ONGOING | UPCOMING | COMPLETED | ALL 중 하나여야 해요',
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: ConcertStatus[];

  @ApiProperty({
    description: '정렬 기준',
    default: 'LATEST',
    enum: ConcertSort,
    enumName: 'ConcertSort',
    required: false,
    example: 'LATEST',
  })
  @IsEnum(ConcertSort, {
    message: 'sort는 LATEST | ALPHABETICAL 중 하나여야 해요',
  })
  @IsOptional()
  sort?: ConcertSort;

  @ApiProperty({
    description: '검색어',
    required: false,
    example: 'a',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '커서(startDate + id 또는 title + id)',
    required: false,
    example: '{"value":"2025.06.20","id":1}',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    description: '가져올 데이터 개수',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  size?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Matches } from 'class-validator';
export class GetConcertsDto {
  @ApiProperty({
    description: '커서 (startDate)',
    required: false,
    example: '2025.12.13',
  })
  @IsOptional()
  @Matches(/^\d{4}\.\d{2}\.\d{2}$/, {
    message: '커서(날짜)는 YYYY.MM.DD 형식이어야 합니다.',
  })
  cursor?: string;

  @ApiProperty({
    description: '콘서트의 ID',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  id?: number;

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

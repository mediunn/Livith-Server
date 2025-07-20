import { ApiProperty } from '@nestjs/swagger';
import { SetlistType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, Matches, Min } from 'class-validator';

export class GetSetlistsDto {
  @ApiProperty({
    description: '셋리스트 타입',
    default: 'ONGOING',
    enum: SetlistType,
    enumName: 'SetlistType',
    example: 'ONGOING',
    required: true,
  })
  @IsEnum(SetlistType, {
    message: 'type은 ONGOING | EXPECTED | PAST 중 하나여야 해요',
  })
  type: SetlistType;

  @ApiProperty({
    description: '커서(마지막 셋리스트의 날짜 값)',
    required: false,
    example: '2025-04-24',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '날짜 형식은 YYYY-MM-DD이어야 합니다.',
  })
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

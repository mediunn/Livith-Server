import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetSetlistSongsDto {
  @ApiProperty({
    description: '커서(마지막 셋리스트의 orderIndex 값)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cursor?: number;

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

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
export class GetConcertsDto {
  @ApiProperty({
    description: '커서 (마지막 콘서트 ID)',
    required: false,
    example: 1562,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
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

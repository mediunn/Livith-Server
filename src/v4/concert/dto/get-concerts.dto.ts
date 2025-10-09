import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
export class GetConcertsDto {
  @ApiProperty({
    description: '커서 (startDate)',
    default: undefined,
    required: false,
    example: undefined,
  })
  @IsOptional()
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

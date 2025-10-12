import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
export class GetCommentsDto {
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
    description: '커서(createdAt + id)',
    required: false,
    example: '{"createdAt":"2025-10-11T05:07:31.000Z","id":1}',
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

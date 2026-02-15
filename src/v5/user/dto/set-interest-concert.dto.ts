import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class SetInterestConcertDto {
  @ApiProperty({
    description: '관심 콘서트 ID',
    example: 1,
  })
  @IsInt()
  concertId: number;
}

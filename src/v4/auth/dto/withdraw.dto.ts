import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class WithDrawDto {
  @ApiProperty({
    description: 'provider',
    example: 'kakao',
    maxLength: 200,
  })
  @MaxLength(200)
  @IsNotEmpty()
  reason: string;
}

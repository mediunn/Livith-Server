import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: '유저 닉네임',
    example: '라이빗',
    maxLength: 10,
  })
  @IsNotEmpty()
  @MaxLength(10)
  nickname: string;

  @ApiProperty({
    description: '마케팅 동의 여부',
    example: true,
  })
  marketingConsent: boolean;
}

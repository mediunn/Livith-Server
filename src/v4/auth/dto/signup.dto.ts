import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, MaxLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: 'provider',
    example: 'kakao',
  })
  @IsNotEmpty()
  provider: string;

  @ApiProperty({
    description: 'provider ID',
    example: 4480239560,
  })
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({
    description: '이메일',
    example: 'livith@gmail.com',
  })
  email: string;

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
  @IsBoolean()
  marketingConsent: boolean;
}

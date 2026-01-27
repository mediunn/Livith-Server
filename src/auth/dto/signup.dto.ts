import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Provider } from '@prisma/client';

export class SignupDto {
  @ApiProperty({
    description: 'provider',
    example: 'kakao',
  })
  @IsNotEmpty()
  provider: Provider;

  @ApiProperty({
    description: 'provider ID',
    example: 4480239560,
  })
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({
    description: '이메일',
    required: false,
    example: 'livith@gmail.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

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

  @ApiProperty({
    description: '유저의 장르 취향',
    example: [1, 2, 3],
    required: true,
    isArray: true,
    type: Number,
  })
  @IsNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsArray()
  preferredGenreIds: number[];

  @ApiProperty({
    description: '유저의 아티스트 취향',
    example: [1, 2, 3],
    required: false,
    isArray: true,
    type: Number,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  preferredArtistIds?: number[];
}

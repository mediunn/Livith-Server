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
  @ArrayMinSize(1, { message: '최소 1개의 장르는 선택해야 합니다.' })
  @ArrayMaxSize(3, { message: '최대 3개의 장르만 선택할 수 있습니다.' })
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
  @ArrayMaxSize(3, { message: '최대 3개의 아티스트만 선택할 수 있습니다.' })
  preferredArtistIds?: number[];
}

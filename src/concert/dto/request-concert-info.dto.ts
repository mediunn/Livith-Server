import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class RequestConcertInfoDto {
  @ApiProperty({
    description: '콘서트명',
    example: '테일러 스위프트 콘서트',
  })
  @IsString()
  @IsNotEmpty({ message: '공연명은 필수 입력 항목입니다.' })
  @MaxLength(50, { message: '공연명은 최대 50자까지 입력 가능합니다.' })
  title: string;

  @ApiProperty({
    description: 'URL',
    example: 'https://www.example.com/concert/1',
  })
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다.' })
  @IsOptional()
  url?: string;

  @ApiProperty({
    description: '관심 콘서트 자동 등록 여부',
    example: true,
  })
  @IsBoolean()
  autoRegister: boolean;

  @ApiProperty({
    description: '추가 요청 내용',
    example: '아티스트명: 테일러 스위프트',
  })
  @IsString()
  @IsOptional()
  requestContent?: string;
}

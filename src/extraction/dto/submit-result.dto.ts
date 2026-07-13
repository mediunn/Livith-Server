import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitResultDto {
  @ApiProperty({ description: '추출된 공연 정보 필드', required: false })
  @IsOptional()
  @IsObject()
  event?: {
    title?: string;
    artist?: string;
    dates?: string;
    preTicketingAt?: string;
    generalTicketingAt?: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ocrText?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  slides?: string[];
}

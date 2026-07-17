import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitResultDto {
  @ApiProperty({ description: '추출된 아티스트명', required: false })
  @IsOptional()
  @IsString()
  artist?: string;
}

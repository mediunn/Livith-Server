import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: '리프레시 토큰',
    example: 'YOUR_REFRESH_TOKEN_HERE',
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

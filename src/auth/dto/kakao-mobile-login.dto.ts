import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class KakaoMobileLoginDto {
  @ApiProperty({
    description: '카카오에서 발급받은 액세스 토큰',
    example: 'YOUR_KAKAO_ACCESS_TOKEN_HERE',
  })
  @IsNotEmpty()
  @IsString()
  accessToken: string;
}

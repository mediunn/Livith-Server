import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class AppleMobileLoginDto {
  @ApiProperty({
    description: '애플에서 발급받은 identityToken',
    example: 'YOUR_APPLE_IDENTITY_TOKEN_HERE',
  })
  @IsString()
  @IsNotEmpty()
  identityToken: string;
}

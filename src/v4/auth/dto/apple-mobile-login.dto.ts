import { ApiProperty } from '@nestjs/swagger';

export class AppleMobileLoginDto {
  @ApiProperty({
    description: '애플에서 발급받은 identityToken',
    example: 'YOUR_APPLE_IDENTITY_TOKEN_HERE',
  })
  identityToken: string;
}

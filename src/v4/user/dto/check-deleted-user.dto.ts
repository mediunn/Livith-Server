import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';
export class CheckDeletedUser {
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
}

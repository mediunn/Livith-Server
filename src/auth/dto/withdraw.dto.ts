import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class WithDrawDto {
  @ApiProperty({
    description: '탈퇴사유',
    example: '원하는 정보가 부족하거나 없어요',
  })
  @IsNotEmpty()
  reason: string;
}

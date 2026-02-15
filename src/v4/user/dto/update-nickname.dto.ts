import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateNicknameDto {
  @ApiProperty({
    description: '새로운 닉네임',
    maxLength: 10,
    example: '라이빗',
  })
  @IsNotEmpty()
  @MaxLength(10)
  nickname: string;
}

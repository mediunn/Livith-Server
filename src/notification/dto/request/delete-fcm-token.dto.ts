import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteFcmTokenDto {
  @ApiProperty({
    description: '삭제할 FCM 토큰',
    example: 'fGhJKSksdkJsmSM',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'FCM 토큰은 비어있을 수 없습니다.' })
  token?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class TestNotificationDto {
  @ApiProperty({
    description: '알림 타입',
    enum: NotificationType,
    example: NotificationType.PRE_TICKETING_OPEN,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: '콘서트 ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  concertId?: number;

  @ApiProperty({
    description: 'true면 FCM 토큰이 등록된 모든 유저에게 발송',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  sendToAll?: boolean;
}

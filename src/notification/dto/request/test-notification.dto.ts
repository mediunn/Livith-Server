import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { IsEnum, IsOptional, IsNumber } from 'class-validator';

export class TestNotificationDto {
  @ApiProperty({
    description: '알림 타입',
    enum: NotificationType,
    example: NotificationType.TICKET_7D,
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
}

import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class TestNotificationDto {
  @ApiProperty({
    description: '알림 타입',
    enum: NotificationType,
    example: NotificationType.TICKET_7D,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: '알림 제목', example: '테스트 알림' })
  @IsString()
  title: string;

  @ApiProperty({ description: '알림 내용', example: '테스트 알림입니다.' })
  @IsString()
  content: string;

  @ApiProperty({
    description: '타겟 ID (콘서트 ID 등)',
    example: '123',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetId?: string;
}

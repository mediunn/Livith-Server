import { ApiProperty } from '@nestjs/swagger';
import { NotificationSet } from '@prisma/client';

// 알림 설정 조회 응답 DTO
export class NotificationSettingResponseDto {
  @ApiProperty({ description: '유저를 위한 혜택 알림', example: false })
  benefitAlert: boolean;

  @ApiProperty({ description: '야간 알림 허용 (21시~08시)', example: false })
  nightAlert: boolean;

  @ApiProperty({ description: '예매 일정 알림', example: true })
  ticketAlert: boolean;

  @ApiProperty({ description: '콘서트 정보 업데이트 알림', example: true })
  infoAlert: boolean;

  @ApiProperty({
    description: '좋아하는 아티스트 콘서트 오픈 알림',
    example: true,
  })
  interestAlert: boolean;

  @ApiProperty({ description: '취향 기반 콘서트 알림', example: true })
  recommendAlert: boolean;

  constructor(notificationSet: NotificationSet) {
    this.benefitAlert = notificationSet.benefitAlert;
    this.nightAlert = notificationSet.nightAlert;
    this.ticketAlert = notificationSet.ticketAlert;
    this.infoAlert = notificationSet.infoAlert;
    this.interestAlert = notificationSet.interestAlert;
    this.recommendAlert = notificationSet.recommendAlert;
  }
}

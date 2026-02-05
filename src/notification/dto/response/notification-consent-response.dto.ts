import { ApiProperty } from '@nestjs/swagger';
import dayjs from 'dayjs';

// 알림 동의 처리 응답 DTO
export class NotificationConsentResponseDto {
  @ApiProperty({ description: '전송자 명칭', example: '라이빗' })
  sender: string;

  @ApiProperty({ description: '수신 일시', example: '2026.01.23 14:30' })
  agreedAt: string;

  @ApiProperty({ description: '처리 내용', example: '알림 동의 처리 완료' })
  message: string;

  constructor(agreedAt: Date, isAgreed: boolean) {
    this.sender = '라이빗';
    this.agreedAt = this.formatDate(agreedAt);
    this.message = isAgreed ? '알림 동의 처리 완료' : '알림 거부 처리 완료';
  }

  private formatDate(date: Date): string {
    return dayjs(date).format('YYYY.MM.DD HH:mm');
  }
}

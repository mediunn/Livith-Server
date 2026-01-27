import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { NotificationField } from '../../enums/notification-field.enum';

// 개별 알림 동의 요청 DTO
export class CreateNotificationConsentDto {
  @ApiProperty({
    description: '알림 필드 이름',
    example: NotificationField.BENEFIT_ALERT,
    enum: NotificationField,
    enumName: 'NotificationField',
  })
  @IsEnum(NotificationField)
  @IsNotEmpty()
  field: NotificationField;

  @ApiProperty({
    description: '동의 여부 (true: 동의, false: 거부)',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isAgreed: boolean;
}

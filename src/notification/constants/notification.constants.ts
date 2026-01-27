import { ConsentType } from '@prisma/client';
import { NotificationField } from '../enums/notification-field.enum';

// 홍보성 알림 필드
export const PROMOTIONAL_FIELDS = [
  NotificationField.BENEFIT_ALERT,
  NotificationField.NIGHT_ALERT,
]as const;

// 알림 필드 -> ConsentType 매핑
export const FIELD_TO_CONSENT_TYPE: Partial<Record<NotificationField, ConsentType>> = {
  [NotificationField.BENEFIT_ALERT]: ConsentType.BENEFIT_PUSH,
  [NotificationField.NIGHT_ALERT]: ConsentType.NIGHT_PUSH,
}


export const NOTIFICATION_DEFAULTS = {
  [NotificationField.BENEFIT_ALERT]: false,
  [NotificationField.NIGHT_ALERT]: false,
  [NotificationField.TICKET_ALERT]: true,
  [NotificationField.INFO_ALERT]: true,
  [NotificationField.INTEREST_ALERT]: true,
  [NotificationField.RECOMMEND_ALERT]: true,
} as const;
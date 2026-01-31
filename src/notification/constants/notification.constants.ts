import { ConsentType, NotificationType } from '@prisma/client';
import { NotificationField } from '../enums/notification-field.enum';

// 홍보성 알림 필드
export const PROMOTIONAL_FIELDS = [NotificationField.BENEFIT_ALERT] as const;

// 알림 필드 -> ConsentType 매핑
export const FIELD_TO_CONSENT_TYPE: Partial<
  Record<NotificationField, ConsentType>
> = {
  [NotificationField.BENEFIT_ALERT]: ConsentType.BENEFIT_PUSH,
  [NotificationField.NIGHT_ALERT]: ConsentType.NIGHT_PUSH,
};

export const NOTIFICATION_DEFAULTS = {
  [NotificationField.BENEFIT_ALERT]: false,
  [NotificationField.NIGHT_ALERT]: false,
  [NotificationField.TICKET_ALERT]: true,
  [NotificationField.INFO_ALERT]: true,
  [NotificationField.INTEREST_ALERT]: true,
  [NotificationField.RECOMMEND_ALERT]: true,
} as const;

// 푸시 발송용
export const NOTIFICATION_TYPE_TO_SET_FIELD: Record<
  NotificationType,
  NotificationField
> = {
  [NotificationType.INTEREST_CONCERT]: NotificationField.INTEREST_ALERT,
  [NotificationType.TICKET_7D]: NotificationField.TICKET_ALERT,
  [NotificationType.TICKET_1D]: NotificationField.TICKET_ALERT,
  [NotificationType.TICKET_TODAY]: NotificationField.TICKET_ALERT,
  [NotificationType.CONCERT_INFO_UPDATE]: NotificationField.INFO_ALERT,
  [NotificationType.ARTIST_CONCERT_OPEN]: NotificationField.INTEREST_ALERT,
  [NotificationType.RECOMMEND]: NotificationField.RECOMMEND_ALERT,
};

export const PROMOTIONAL_NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.RECOMMEND,
];

export const AD_PREFIX = '(광고) ';
export const AD_SUFFIX = '\n 수신 거부: 마이페이지 > 알림 설정';

export const FCM_INVALID_TOKEN_ERROR_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
] as const;

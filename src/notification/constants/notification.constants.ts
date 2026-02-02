import { ConsentType, NotificationType } from '@prisma/client';
import { NotificationField } from '../enums/notification-field.enum';
import { ConcertInfoUpdateType } from '../enums/concert-info-update-type.enum';

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

// 콘서트 정보 업데이트 알림 - 업데이트 종류별 문구
export const CONCERT_INFO_UPDATE_MESSAGES: Record<
  ConcertInfoUpdateType,
  (concertTitle: string) => string
> = {
  [ConcertInfoUpdateType.SETLIST]: (t) =>
    `${t}콘서트 공연의 예상 셋리스트가 등록 됐어요. 콘서트 가기 전까지 주요 노래를 익혀보아요!`,
  [ConcertInfoUpdateType.MD_INFO]: (t) =>
    `기다리던 ${t}콘서트의 공식 굿즈 라인업이 공개 됐어요! 어떤 아이템들이 있는지 지금 바로 확인해보아요!`,
  [ConcertInfoUpdateType.CONCERT_DETAIL]: (t) =>
    `${t}콘서트의 새로운 소식이 도착했어요! 공연을 더 풍성하게 즐길 수 있는지 추가 안내 사항을 지금 확인해 보세요!`,
  [ConcertInfoUpdateType.SCEDULE]: (t) =>
    `${t}콘서트의 일정이 업데이트 되었어요! 소중한 관람 기회를 놓치지 않도록 일정을 꼭 체크해 주세요!`,
  [ConcertInfoUpdateType.TICKET]: (t) =>
    `${t}콘서트 티켓 예매 정보가 업데이트 됐어요! 티켓팅 성공을 위해 상세 내용을 미리 확인해 보세요!`,
};

// 콘서트 알림 큐 event_type 상수
export const CONCERT_NOTIFICATION_EVENT_TYPE = {
  ARTIST_CONCERT_OPEN: 'ARTIST_CONCERT_OPEN',
  CONCERT_INFO_UPDATE_SETLIST: 'CONCERT_INFO_UPDATE_SETLIST',
  CONCERT_INFO_UPDATE_MD_INFO: 'CONCERT_INFO_UPDATE_MD_INFO',
  CONCERT_INFO_UPDATE_CONCERT_DETAIL: 'CONCERT_INFO_UPDATE_CONCERT_DETAIL',
  CONCERT_INFO_UPDATE_SCHEDULE: 'CONCERT_INFO_UPDATE_SCHEDULE',
  CONCERT_INFO_UPDATE_TICKET: 'CONCERT_INFO_UPDATE_TICKET',
} as const;

// 큐 event_type -> ConcertInfoUpdateType 매핑
export const CONCERT_NOTIFICATION_EVENT_TYPE_TO_UPDATE_TYPE: Partial<
  Record<string, ConcertInfoUpdateType>
> = {
  [CONCERT_NOTIFICATION_EVENT_TYPE.CONCERT_INFO_UPDATE_SETLIST]:
    ConcertInfoUpdateType.SETLIST,
  [CONCERT_NOTIFICATION_EVENT_TYPE.CONCERT_INFO_UPDATE_MD_INFO]:
    ConcertInfoUpdateType.MD_INFO,
  [CONCERT_NOTIFICATION_EVENT_TYPE.CONCERT_INFO_UPDATE_CONCERT_DETAIL]:
    ConcertInfoUpdateType.CONCERT_DETAIL,
  [CONCERT_NOTIFICATION_EVENT_TYPE.CONCERT_INFO_UPDATE_SCHEDULE]:
    ConcertInfoUpdateType.SCEDULE,
  [CONCERT_NOTIFICATION_EVENT_TYPE.CONCERT_INFO_UPDATE_TICKET]:
    ConcertInfoUpdateType.TICKET,
};

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

export const PROMOTIONAL_NOTIFICATION_TYPES: NotificationType[] = [];

export const AD_PREFIX = '(광고) ';
export const AD_SUFFIX = '\n 수신 거부: 마이페이지 > 알림 설정';

export const FCM_INVALID_TOKEN_ERROR_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
] as const;

import { ConsentType, NotificationType } from '@prisma/client';
import { NotificationField } from '../enums/notification-field.enum';
import { ConcertInfoUpdateType } from '../enums/concert-info-update-type.enum';

// 홍보성 알림 필드
export const PROMOTIONAL_FIELDS = [NotificationField.BENEFIT_ALERT] as const;

// 배치 처리 크기 상수
// 일반 사용자 배치 처리: sendPushNotification에 전달할 사용자 ID 배치 크기
export const NOTIFICATION_BATCH_SIZE = 1000;

// 아티스트 조회 배치 처리: representativeArtist 테이블 조회 시 배치 크기
export const NOTIFICATION_ARTIST_BATCH_SIZE = 1000;

// 추천 알림 사용자 처리: 각 사용자마다 개별 추천 콘서트 조회 필요(100명씩 배치 크기 적용)
export const NOTIFICATION_RECOMMEND_BATCH_SIZE = 100;

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

// 콘서트 정보 업데이트 알림 - NotificationType별 문구
export const CONCERT_INFO_UPDATE_MESSAGES: Partial<
  Record<
    NotificationType,
    { title: string; content: (concertTitle: string) => string }
  >
> = {
  [NotificationType.CONCERT_INFO_UPDATE_SETLIST]: {
    title: '셋리스트가 등록이 됐어요!',
    content: (t) =>
      `${t} 콘서트 공연의 예상 셋리스트가 등록됐어요. 콘서트 가기 전까지 주요 노래를 익혀보아요!`,
  },
  [NotificationType.CONCERT_INFO_UPDATE_MD]: {
    title: 'MD 정보가 업데이트가 됐어요!',
    content: (t) =>
      `${t} 콘서트의 공식 굿즈 라인업이 공개됐어요. 어떤 아이템들이 있는지 지금 바로 확인해볼까요?`,
  },
  [NotificationType.CONCERT_INFO_UPDATE_DETAIL]: {
    title: '관심 콘서트의 새로운 소식이 도착했어요!',
    content: (t) =>
      `${t} 공연을 더 풍성하게 즐길 수 있는 안내 사항을 지금 확인해 보세요!`,
  },
  [NotificationType.CONCERT_INFO_UPDATE_SCHEDULE]: {
    title: '관심 콘서트의 새로운 소식이 도착했어요!',
    content: (t) =>
      `${t} 콘서트의 일정이 업데이트 되었어요. 소중한 관람 기회를 놓치지 않도록 일정을 꼭 체크해주세요!`,
  },
  [NotificationType.CONCERT_INFO_UPDATE_TICKET]: {
    title: '관심 콘서트의 새로운 소식이 도착했어요!',
    content: (t) =>
      `${t} 콘서트 티켓 예매 정보가 업데이트 됐어요. 티켓팅 성공을 위해 상세 내용을 미리 확인해보세요.`,
  },
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
    ConcertInfoUpdateType.SCHEDULE,
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
  [NotificationType.CONCERT_INFO_UPDATE_SETLIST]: NotificationField.INFO_ALERT,
  [NotificationType.CONCERT_INFO_UPDATE_MD]: NotificationField.INFO_ALERT,
  [NotificationType.CONCERT_INFO_UPDATE_DETAIL]: NotificationField.INFO_ALERT,
  [NotificationType.CONCERT_INFO_UPDATE_SCHEDULE]: NotificationField.INFO_ALERT,
  [NotificationType.CONCERT_INFO_UPDATE_TICKET]: NotificationField.INFO_ALERT,
  [NotificationType.ARTIST_CONCERT_OPEN]: NotificationField.INTEREST_ALERT,
  [NotificationType.RECOMMEND]: NotificationField.RECOMMEND_ALERT,
};

// ConcertInfoUpdateType -> NotificationType 매핑
export const UPDATE_TYPE_TO_NOTIFICATION_TYPE: Record<
  ConcertInfoUpdateType,
  NotificationType
> = {
  [ConcertInfoUpdateType.SETLIST]: NotificationType.CONCERT_INFO_UPDATE_SETLIST,
  [ConcertInfoUpdateType.MD_INFO]: NotificationType.CONCERT_INFO_UPDATE_MD,
  [ConcertInfoUpdateType.CONCERT_DETAIL]:
    NotificationType.CONCERT_INFO_UPDATE_DETAIL,
  [ConcertInfoUpdateType.SCHEDULE]:
    NotificationType.CONCERT_INFO_UPDATE_SCHEDULE,
  [ConcertInfoUpdateType.TICKET]: NotificationType.CONCERT_INFO_UPDATE_TICKET,
};

export const PROMOTIONAL_NOTIFICATION_TYPES: NotificationType[] = [];

export const AD_PREFIX = '(광고) ';
export const AD_SUFFIX = '\n 수신 거부: 마이페이지 > 알림 설정';

export const FCM_INVALID_TOKEN_ERROR_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
] as const;

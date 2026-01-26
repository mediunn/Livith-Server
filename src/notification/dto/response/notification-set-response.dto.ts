import { ApiProperty } from "@nestjs/swagger";


export class NotificationSettingResponseDto{
    @ApiProperty({
        description: '예매 일정 알림',
        example: true,
    })
    ticketAlert: boolean;

    @ApiProperty({
        description: '콘서트 정보 업데이트 알림',
        example: true,
    })
    infoAlert: boolean;

    @ApiProperty({
        description: '좋아하는 아티스트 콘서트 오픈 알림',
        example: true,
    })
    interestAlert: boolean;

    @ApiProperty({
        description: '취향 기반 콘서트 알림 (홍보성)',
        example: true,
    })
    recommendAlert: boolean;

    @ApiProperty({
        description: '야간 알림 허용 (21시~08시)',
        example: false,
    })
    nightAlert: boolean;

    @ApiProperty({
        description: '홍보성 알림 동의 여부(배너 표시용)',
        example: false,
    })
    hasMarketingConsent: boolean;

    constructor(
        notificationSet: {
            ticketAlert: boolean;
            infoAlert: boolean;
            interestAlert: boolean;
            recommendAlert: boolean;
            nightAlert: boolean;
        },
        hasMarketingConsent: boolean,
    ){
        this.ticketAlert = notificationSet.ticketAlert;
        this.infoAlert = notificationSet.infoAlert;
        this.interestAlert = notificationSet.interestAlert;
        this.recommendAlert = notificationSet.recommendAlert;
        this.nightAlert = notificationSet.nightAlert;
        this.hasMarketingConsent = hasMarketingConsent;
    }
}
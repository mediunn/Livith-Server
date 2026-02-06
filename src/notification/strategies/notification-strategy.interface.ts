import { NotificationType } from "@prisma/client";

export interface NotificationTargetParams{
    concertId?: number;
    scheduleId?: number;
    updateType?: string;
    concertTitle?: string;
    content?: string;
    timeStr?: string;
    daysUntil?: number;
    [key: string]: any;
}


export interface NotificationMessage{
    title: string;
    content: string;
}

export interface NotificationStrategy{
    readonly type: NotificationType;

    /**
     * 알림 대상 유저 ID 목록 조회
     */
    getTargetUserIds(params: NotificationTargetParams): Promise<number[]>;

    /**
     * 알림 메시지 생성
     */
    buildMessage(params: NotificationTargetParams): Promise<NotificationMessage>;
}
import { ApiProperty } from "@nestjs/swagger";
import { NotificationType } from "@prisma/client";

// 알림 목록 조회 응답 DTO
export class NotificationResponseDto{
    @ApiProperty({description: '알림 ID', example: 123})
    id: number;

    @ApiProperty({
        description: '알림 타입',
        enum: NotificationType,
        example: 'INTEREST_CONCERT'
    })
    type: NotificationType;

    @ApiProperty({
        description: '알림 제목(홍보성 알림은 "(광고)" 포함)',
        example: '(광고) 특별 혜택 안내',
    })
    title: string;

    @ApiProperty({
        description: '알림 내용',
        example: '좋아하는 아티스트의 내한 공연 소식이 도착했어요!'
    })
    content: string;

    @ApiProperty({
        description: '딥링크 URL(알림 눌렀을 때 페이지로 이동하기 위함)',
        example: 'livith://concert/123',
        required: false,
    })
    deepLink?: string;

    @ApiProperty({
        description: '읽음 상태(읽으면 true, 안 읽으면 false)',
        example: false,
    })
    isRead: boolean;

    @ApiProperty({
        description: '알림 생성 일시 (ISO 8501 형식)',
        example: '2026.01.20'
    })
    createdAt: string;
}
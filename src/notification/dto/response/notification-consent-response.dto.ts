import { ApiProperty } from "@nestjs/swagger";

export class NotificationConsenResponseDto{
    @ApiProperty({
        description: '전송자 명칭',
        example: '라이빗',
    })
    sender: string;

    @ApiProperty({
        description: '수신 일시',
        example: '2026.01.23 14:30',
    })
    agreedAt: string;

    @ApiProperty({
        description: '처리 내용',
        example: '알림 동의 처리 완료',
    })
    message: string;

    constructor(agreedAt: Date){
        this.sender = '라이빗';
        this.agreedAt = this.formatDate(agreedAt);
        this.message = '알림 동의 처리 완료';
    }

    private formatDate(date: Date): string{
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}.${month}.${day} ${hours}:${minutes}`;
    }

}
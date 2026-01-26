import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from 'class-validator';


export class NotificationConsentDto{
    @ApiProperty({
        description: '광고성 정보 수신 동의',
        example: true,
    })
    @IsBoolean()
    marketingConsent: boolean;

    @ApiProperty({
        description: '야간 푸시 알림 동의',
        example: true,
    })
    @IsBoolean()
    nightAlertConsent: boolean;
}
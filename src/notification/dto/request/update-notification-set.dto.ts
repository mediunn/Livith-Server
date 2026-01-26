import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional} from 'class-validator';

export class UpdateNotficationSettingDto{
    @ApiProperty({
        description: '예매 일정 알림',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    ticketAlert?: boolean;

    @ApiProperty({
        description: '콘서트 정보 업데이트 알림',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    infoAlert?: boolean;

    @ApiProperty({
        description: '좋아하는 아티스트 콘서트 오픈 알림',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    interestAlert?: boolean;

    @ApiProperty({
        description: '취향 기반 콘서트 알림(홍보성)',
        example: false,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    recommendAlert?: boolean;

    @ApiProperty({
        description: '야간 알림 허용(21시~08시)',
        example: false,
        required: false,
    })
    nightAlert?: boolean;
}
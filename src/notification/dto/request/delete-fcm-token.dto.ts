import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from 'class-validator';

export class DeleteFcmTokenDto{
    @ApiProperty({
        description: '삭제할 FCM 토큰',
        example: 'fGhJKSksdkJsmSM',
        required: false,
    })
    @IsString()
    @IsOptional()
    token?: string;
}
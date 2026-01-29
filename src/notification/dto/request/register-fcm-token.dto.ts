import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterFcmTokenDto{
    @ApiProperty({
        description: 'FCM 토큰',
        example: 'fGhJkMnOpsldJSl',
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}
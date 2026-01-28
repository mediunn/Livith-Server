import { ApiProperty } from '@nestjs/swagger';
import {IsIn, IsInt, IsOptional, Max, Min} from 'class-validator';

export class GetNotificationDto{
    @ApiProperty({
        description: 'cursor (id 값), cursor 원치 않으면 비우기',
        example: 1487,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    cursor?: number;

    @ApiProperty({
        description: '몇 개의 데이터를 가져올 건지 지정',
        example: 20,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    size?: number = 20;
}
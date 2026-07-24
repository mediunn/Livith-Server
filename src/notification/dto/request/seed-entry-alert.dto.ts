import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';

/**
 * 앱 진입 알림(entry-alerts) 더미 시드 종류
 * - REGISTERED: 관심 콘서트에 추가됨(요청 결과 성공)
 * - FAILED: 요청 실패
 * - AUTO_REMOVED_COMPLETED: 종료되어 자동 정리됨
 * - AUTO_REMOVED_CANCELED: 취소되어 자동 정리됨
 */
export enum SeedEntryAlertKind {
  REGISTERED = 'REGISTERED',
  FAILED = 'FAILED',
  AUTO_REMOVED_COMPLETED = 'AUTO_REMOVED_COMPLETED',
  AUTO_REMOVED_CANCELED = 'AUTO_REMOVED_CANCELED',
}

export class SeedEntryAlertDto {
  @ApiProperty({
    description: 'true면 활성(deletedAt=null) 전체 유저, false면 호출자 본인만',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  sendToAll?: boolean;

  @ApiProperty({
    description: '넣을 알림 종류(생략 시 전체)',
    enum: SeedEntryAlertKind,
    isArray: true,
    required: false,
    example: Object.values(SeedEntryAlertKind),
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SeedEntryAlertKind, { each: true })
  kinds?: SeedEntryAlertKind[];
}
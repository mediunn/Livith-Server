import { ApiProperty } from '@nestjs/swagger';

export enum EntryAlertKind {
  AUTO_REMOVED_COMPLETED = 'AUTO_REMOVED_COMPLETED',
  AUTO_REMOVED_CANCELED = 'AUTO_REMOVED_CANCELED',
  REQUEST_REGISTERED = 'REQUEST_REGISTERED',
  REQUEST_FAILED = 'REQUEST_FAILED',
}

export class EntryAlertItemDto {
  @ApiProperty({ enum: EntryAlertKind })
  kind: EntryAlertKind;

  @ApiProperty({ example: '자동 정리된 공연 2' })
  title: string;

  @ApiProperty({ example: '오크 록 내한 공연 외 1건이 자동 정리 됐어요' })
  content: string;

  @ApiProperty({
    required: false,
    example: 55,
    description: 'REQUEST_REGISTERED 때 콘서트 상세 이동용 ID',
  })
  concertId?: number;
}

export class EntryAlertResponseDto {
  @ApiProperty({ type: [EntryAlertItemDto] })
  items: EntryAlertItemDto[];

  constructor(items: EntryAlertItemDto[]) {
    this.items = items;
  }
}


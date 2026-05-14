import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';

export class ReportCommentDto {
  @ApiProperty({
    description: '신고 사유',
    maxLength: 200,
    example: '부적절한 내용이 포함되어 있습니다.',
  })
  @IsOptional()
  @MaxLength(200)
  content: string;
}

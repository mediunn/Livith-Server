// dto/create-comment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    maxLength: 400,
    example: '이번 공연 너무 기대돼요!',
  })
  @IsNotEmpty()
  @MaxLength(400)
  content: string;
}

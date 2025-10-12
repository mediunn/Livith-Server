import { ConcertComment } from '@prisma/client';

export class CommentResponseDto {
  id: number;
  userId: number;
  nickname: string;
  concertId: number;
  content: string;
  createdAt: Date;

  constructor(comment: ConcertComment, nickname: string) {
    this.id = comment.id;
    this.userId = comment.userId;
    this.nickname = nickname;
    this.concertId = comment.concertId;
    this.content = comment.content;
    this.createdAt = comment.createdAt;
  }
}

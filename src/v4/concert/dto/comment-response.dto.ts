export class CommentResponseDto {
  id: number;
  userId: number;
  concertId: number;
  content: string;
  createdAt: Date;

  constructor(comment: any) {
    this.id = comment.id;
    this.userId = comment.userId;
    this.concertId = comment.concertId;
    this.content = comment.content;
    this.createdAt = comment.createdAt;
  }
}

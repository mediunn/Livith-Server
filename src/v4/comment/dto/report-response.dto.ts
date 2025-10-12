import { Report } from '@prisma/client';

export class ReportResponseDto {
  commentId: number;
  content: string;
  createdAt: Date;

  constructor(report: Report) {
    this.commentId = report.commentId;
    this.content = report.content;
    this.createdAt = report.createdAt;
  }
}

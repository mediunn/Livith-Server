import { Report } from '@prisma/client';

export class ReportResponseDto {
  id: number;
  commentId: number;
  commentUserId: number;
  commentContent: string;
  reportReason: string;
  createdAt: Date;

  constructor(report: Report) {
    this.id = report.id;
    this.commentId = report.commentId;
    this.commentUserId = report.commentUserId;
    this.commentContent = report.commentContent;
    this.reportReason = report.reportReason;
    this.createdAt = report.createdAt;
  }
}

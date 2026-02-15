import { Injectable } from '@nestjs/common';
import {
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { PrismaService } from '../../../prisma-v4/prisma.service';
import { ReportResponseDto } from './dto/report-response.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}

  // 댓글 삭제
  async deleteComment(commentId: number, userId: number) {
    const comment = await this.prismaService.concertComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND);
    }

    // 유저 ID가 유효한지 확인
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }

    // 본인 댓글인지 체크
    if (comment.userId !== userId) {
      throw new ForbiddenException(ErrorCode.COMMENT_DELETE_FORBIDDEN);
    }

    // 신고 기록이 있는 경우에만 comment 내용과 userId 업데이트
    await this.prismaService.report.updateMany({
      where: { commentId: comment.id },
      data: {
        commentUserId: comment.userId,
        commentContent: comment.content,
      },
    });

    await this.prismaService.concertComment.delete({
      where: { id: commentId },
    });
    return;
  }

  // 댓글 신고
  async reportComment(commentId: number, userId: number, reason?: string) {
    const comment = await this.prismaService.concertComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(ErrorCode.COMMENT_NOT_FOUND);
    }

    // 유저 ID가 유효한지 확인
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }

    // 댓글 신고 처리
    const reportedComment = await this.prismaService.report.create({
      data: {
        commentId: commentId,
        reportReason: reason,
        commentUserId: comment.userId,
        commentContent: comment.content,
      },
    });

    return new ReportResponseDto(reportedComment);
  }
}

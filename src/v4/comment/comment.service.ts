import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CommentResponseDto } from './dto/comment-response.dto';
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
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    // 유저 ID가 유효한지 확인
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    }

    // 본인 댓글인지 체크
    if (comment.userId !== userId) {
      throw new ForbiddenException('본인의 댓글만 삭제할 수 있습니다.');
    }

    const deletedComment = await this.prismaService.concertComment.delete({
      where: { id: commentId },
    });
    return new CommentResponseDto(deletedComment);
  }

  // 댓글 신고
  async reportComment(commentId: number, content: string) {
    const comment = await this.prismaService.concertComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    // 댓글 신고 처리
    const reportedComment = await this.prismaService.report.create({
      data: {
        commentId: commentId,
        content: content,
      },
    });

    return new ReportResponseDto(reportedComment);
  }
}

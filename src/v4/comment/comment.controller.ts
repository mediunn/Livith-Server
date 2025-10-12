import { Controller, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParsePositiveIntPipe } from '../common/pipes/parse-positive-int.pipe';

@ApiTags('댓글')
@Controller('api/v4/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 댓글 삭제
  @Delete(':id')
  // 로그인한 사용자만 댓글 삭제 가능
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '특정 댓글 삭제',
    description: '특정 댓글을 삭제합니다.',
  })
  deleteComment(@Param('id', ParsePositiveIntPipe) id: number, @Req() req) {
    const userId = req.user.userId;
    console.log(userId);
    return this.commentService.deleteComment(id, userId);
  }
}

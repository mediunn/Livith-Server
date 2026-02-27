import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { PrismaService } from 'prisma/prisma.service';
import { CommentController } from './comment.controller';

@Module({
  providers: [CommentService, PrismaService],
  controllers: [CommentController],
})
export class CommentModule {}

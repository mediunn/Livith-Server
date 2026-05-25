import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppleReviewService } from './apple-review.service';

@Module({
  imports: [HttpModule],
  providers: [AppleReviewService],
})
export class AppleReviewModule {}

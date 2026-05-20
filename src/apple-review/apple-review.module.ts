import { Module } from '@nestjs/common';
import { AppleReviewService } from './apple-review.service';

@Module({
  providers: [AppleReviewService],
})
export class AppleReviewModule {}

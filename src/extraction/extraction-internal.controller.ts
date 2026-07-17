import { ApiExcludeController } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { WorkerTokenGuard } from './guard/worker-token.guard';
import { ExtractionService } from './extraction.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { ReportFailDto } from './dto/report-fail.dto';

@ApiExcludeController() // 내부 API - Swagger 노출 제외
@Controller('internal/extraction-jobs')
@UseGuards(WorkerTokenGuard)
export class ExtractionInternalController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Get('claim')
  async claim(@Res({ passthrough: true }) res: Response) {
    const job = await this.extractionService.claimNext();
    if (!job) {
      res.status(204).send(); // 빈 큐
      return;
    }
    return job; // -> data: { jobId, instagramUrl }
  }

  @Post(':id/result')
  @HttpCode(200)
  async submitResult(@Param('id') id: string, @Body() dto: SubmitResultDto) {
    const job = await this.extractionService.submitResult(id, dto);
    return { jobId: job.id, status: job.status };
  }

  @Post(':id/fail')
  @HttpCode(200)
  async reportFail(@Param('id') id: string, @Body() dto: ReportFailDto) {
    const job = await this.extractionService.reportFail(id, dto.reason);
    return { jobId: job.id, status: job.status };
  }
}

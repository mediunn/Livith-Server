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

@ApiExcludeController() // 내부 API - Swagger 노출 제외
@Controller('internal/extraction-jobs')
@UseGuards(WorkerTokenGuard)
export class ExtractionInternalController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Get('claim')
  async claim(@Res() res: Response) {
    const job = await this.extractionService.claimNext();
    if (!job) return res.status(204).send();
    return res.status(200).json({ data: job });
  }

  @Post(':id/result')
  @HttpCode(200)
  async submitResult(@Param('id') id: string, @Body() dto: SubmitResultDto) {
    const job = await this.extractionService.submitResult(id, dto);
    return { jobId: job.id, status: job.status };
  }

  @Post(':id/fail')
  @HttpCode(200)
  async reportFail(@Param('id') id: string, @Body() body: { reason?: string }) {
    const job = await this.extractionService.reportFail(id, body?.reason);
    return { jobId: job.id, status: job.status };
  }
}

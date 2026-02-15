import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MetricsModule } from '../src/v5/metrics/metrics.module'; // If metrics is not used, remove this import

@Module({
  imports: [MetricsModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MetricsModule } from '../src/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

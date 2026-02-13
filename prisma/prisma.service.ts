import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static readonly SLOW_QUERY_THRESHOLD_SECONDS = 1;

  constructor(
    @InjectMetric('db_query_duration_seconds')
    private readonly queryDuration: Histogram<string>,

    @InjectMetric('db_query_total')
    private readonly queryCounter: Counter<string>,

    @InjectMetric('db_slow_query_total')
    private readonly slowQueryCounter: Counter<string>,
  ) {
    super();
    this.$use(async (params, next) => {
      const start = Date.now();
      const operation = params.action;
      const model = params.model ?? 'unknown';
      let success = true;

      try{
        return await next(params);
      }catch (error) {
        success = false;
        throw error;
      }finally {
        const duration = (Date.now() - start) / 1000;
        const successLabel = String(success);

        this.queryDuration.observe({ operation, model, success: successLabel }, duration);
        this.queryCounter.inc({ operation, model, success: successLabel });

        if (success && duration > PrismaService.SLOW_QUERY_THRESHOLD_SECONDS) {
          this.slowQueryCounter.inc({ operation, model });
        }
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

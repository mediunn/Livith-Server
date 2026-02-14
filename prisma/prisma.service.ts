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

      try{
        const result = await next(params);
        const duration = (Date.now() - start) / 1000;

        this.queryDuration.observe({operation, model, success: 'true'}, duration);
        this.queryCounter.inc({operation, model, success: 'true'});

        if(duration > PrismaService.SLOW_QUERY_THRESHOLD_SECONDS){
          this.slowQueryCounter.inc({operation, model});
        }

        return result;
      }catch (error) {
        const duration = (Date.now() - start) / 1000;
        this.queryDuration.observe({operation, model, success: 'false'}, duration);
        this.queryCounter.inc({operation, model, success: 'false'});
        throw error;
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

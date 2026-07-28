import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { ExtractionModule } from './extraction.module';
import { ExtractionService } from './extraction.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcertArtistIndexService } from '../meilisearch/concert-artist-index.service';

// 실제 MeilisearchModule(@Global)이 공급하는 의존성을 부팅 없이 대체
@Global()
@Module({
  providers: [{ provide: ConcertArtistIndexService, useValue: {} }],
  exports: [ConcertArtistIndexService],
})
class FakeMeilisearchModule {}

describe('ExtractionScheduler (module wiring)', () => {
  let moduleRef: TestingModule;
  let registry: SchedulerRegistry;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
        ConfigModule.forRoot({ isGlobal: true }),
        FakeMeilisearchModule,
        ExtractionModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({ $executeRaw: jest.fn().mockResolvedValue(0) })
      .compile();

    await moduleRef.init();
    registry = moduleRef.get(SchedulerRegistry);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  // ExtractionScheduler가 providers에 빠지면 @Cron이 조용히 등록되지 않는다.
  it('@Cron 잡 2개가 SchedulerRegistry에 등록된다', () => {
    expect(registry.getCronJobs().size).toBe(2);
  });

  it('등록된 cron 콜백이 ExtractionService를 호출한다', async () => {
    const service = moduleRef.get(ExtractionService);
    const expire = jest.spyOn(service, 'expireOverdueJobs').mockResolvedValue();
    const cleanup = jest.spyOn(service, 'cleanupOldJobs').mockResolvedValue(0);

    for (const job of registry.getCronJobs().values()) {
      await job.fireOnTick();
    }

    expect(expire).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

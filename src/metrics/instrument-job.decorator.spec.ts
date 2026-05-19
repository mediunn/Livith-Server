import 'reflect-metadata';
import { Cron } from '@nestjs/schedule';
import { InstrumentJob } from './instrument-job.decorator';

describe('InstrumentJob', () => {
  const makeMetricsMock = () => {
    const endTimer = jest.fn();
    return {
      endTimer,
      schedulerMetrics: {
        executionCounter: { inc: jest.fn() },
        durationHistogram: { startTimer: jest.fn().mockReturnValue(endTimer) },
        itemsProcessed: { inc: jest.fn() },
        successCounter: { inc: jest.fn() },
        failureCounter: { inc: jest.fn() },
        lastSuccessTimestamp: { set: jest.fn() },
      } as any,
    };
  };

  describe('@Cron 메타데이터 보존 (회귀: cron job 미등록 버그)', () => {
    class OnlyCron {
      @Cron('* * * * *')
      job(): number {
        return 0;
      }
    }

    class CronThenInstrument {
      @InstrumentJob('test_job')
      @Cron('* * * * *')
      job(): number {
        return 0;
      }
    }

    it('@Cron 이 붙인 모든 메타데이터 키가 래퍼에도 그대로 존재한다', () => {
      const cronKeys = Reflect.getMetadataKeys(OnlyCron.prototype.job);
      const wrappedKeys = Reflect.getMetadataKeys(
        CronThenInstrument.prototype.job,
      );

      expect(cronKeys.length).toBeGreaterThan(0); // @Cron 이 실제로 키를 심음
      for (const key of cronKeys) {
        expect(wrappedKeys).toContain(key);
        expect(
          Reflect.getMetadata(key, CronThenInstrument.prototype.job),
        ).toEqual(Reflect.getMetadata(key, OnlyCron.prototype.job));
      }
    });

    it('메서드는 래퍼로 교체되어 있다 (원본과 다른 함수)', () => {
      expect(CronThenInstrument.prototype.job).not.toBe(OnlyCron.prototype.job);
    });
  });

  describe('메트릭 계측 동작', () => {
    it('성공 시 execution/success/lastSuccess 증가 + 원본 결과 반환', async () => {
      const { schedulerMetrics, endTimer } = makeMetricsMock();
      const original = jest.fn().mockResolvedValue(7);

      const descriptor: PropertyDescriptor = { value: original };
      InstrumentJob('job_a')({}, 'job', descriptor);

      const result = await descriptor.value.call({ schedulerMetrics });

      expect(result).toBe(7);
      expect(original).toHaveBeenCalledTimes(1);
      expect(schedulerMetrics.executionCounter.inc).toHaveBeenCalledWith({
        job_name: 'job_a',
      });
      expect(schedulerMetrics.itemsProcessed.inc).toHaveBeenCalledWith(
        { job_name: 'job_a' },
        7,
      );
      expect(schedulerMetrics.successCounter.inc).toHaveBeenCalled();
      expect(schedulerMetrics.lastSuccessTimestamp.set).toHaveBeenCalled();
      expect(schedulerMetrics.failureCounter.inc).not.toHaveBeenCalled();
      expect(endTimer).toHaveBeenCalledTimes(1);
    });

    it('예외 시 failure 증가 + 에러 전파 + 타이머 종료', async () => {
      const { schedulerMetrics, endTimer } = makeMetricsMock();
      const boom = new Error('boom');
      const original = jest.fn().mockRejectedValue(boom);

      const descriptor: PropertyDescriptor = { value: original };
      InstrumentJob('job_b')({}, 'job', descriptor);

      await expect(
        descriptor.value.call({ schedulerMetrics }),
      ).rejects.toThrow('boom');

      expect(schedulerMetrics.failureCounter.inc).toHaveBeenCalledWith({
        job_name: 'job_b',
      });
      expect(schedulerMetrics.successCounter.inc).not.toHaveBeenCalled();
      expect(endTimer).toHaveBeenCalledTimes(1);
    });
  });
});
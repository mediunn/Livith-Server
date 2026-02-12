import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class InterestConcertNotificationScheduler {
  private readonly logger = new Logger(
    InterestConcertNotificationScheduler.name,
  );
  private static readonly JOB_NAME = 'interest_concert_notification';

  constructor(
    private readonly notificationService: NotificationService,
    @InjectMetric('scheduler_job_execution_total')
    private readonly executionCounter: Counter<string>,
    @InjectMetric('scheduler_job_duration_seconds')
    private readonly durationHistogram: Histogram<string>,
    @InjectMetric('scheduler_job_success_total')
    private readonly successCounter: Counter<string>,
    @InjectMetric('scheduler_job_failure_total')
    private readonly failureCounter: Counter<string>,
    @InjectMetric('scheduler_job_items_processed')
    private readonly itemsProcessed: Counter<string>,
    @InjectMetric('scheduler_job_last_success_timestamp')
    private readonly lastSuccessTimestamp: Gauge<string>,
  ) {}

  // 주 1회 화요일 오전 10시: 관심 콘서트가 없는 유저에게 설정 푸시
  @Cron('0 10 * * 2', { timeZone: 'Asia/Seoul' })
  async sendInterestConcertNotifications() {
    const jobName = InterestConcertNotificationScheduler.JOB_NAME;
    this.executionCounter.inc({ job_name: jobName });
    const endTimer = this.durationHistogram.startTimer({ job_name: jobName });

    try {
      const { sent, failed } =
        await this.notificationService.sendNotificationByStrategy(
          NotificationType.INTEREST_CONCERT,
          {},
        );

      this.itemsProcessed.inc({ job_name: jobName }, sent);
      this.successCounter.inc({ job_name: jobName });
      this.lastSuccessTimestamp.set({ job_name: jobName }, Date.now() / 1000);

      if (sent > 0 || failed > 0) {
        this.logger.log(
          `interest concert notifications sent: ${sent}, failed: ${failed}`,
        );
      } else {
        this.logger.log('No users without interest concert found');
      }
    } catch (error) {
      this.failureCounter.inc({ job_name: jobName });
      throw error;
    } finally {
      endTimer();
    }
  }
}

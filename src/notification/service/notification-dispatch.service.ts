import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);
  private readonly claimedBy = `${os.hostname()}#${process.pid}`;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 발송 직전 원자적 claim.
   * - 신규: INSERT IGNORE 성공(affected 1) -> 선점
   * - 기존: FAILED이거나 10분 넘게 SENDING(죽은 claim) 인 건만 탈취
   * @returns true면 이 호출자가 발송 책임을 가짐
   */
  async tryClaim(scheduleId: number, type: NotificationType): Promise<boolean> {
    const inserted = await this.prisma.$executeRaw(Prisma.sql`
      INSERT IGNORE INTO notification_dispatch
             (schedule_id, type, status, claimed_at, claimed_by)
      VALUES 
             (${scheduleId}, ${type}, 'SENDING', NOW(3), ${this.claimedBy})
    `);
    if (inserted === 1) return true;

    const taken = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE notification_dispatch
        SET status = 'SENDING',
            claimed_at = NOW(3),
            claimed_by = ${this.claimedBy},
            completed_at = NULL
      WHERE schedule_id = ${scheduleId}
        AND type = ${type}
        AND (
          status = 'FAILED'
          OR (status = 'SENDING' AND claimed_at < NOW(3) - INTERVAL 10 MINUTE)
        )
    `);
    return taken === 1;
  }

  async markSent(scheduleId: number, type: NotificationType): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE notification_dispatch
        SET status = 'SENT', completed_at = NOW(3)
      WHERE schedule_id = ${scheduleId} AND type = ${type} AND claimed_by = ${this.claimedBy}
    `);
  }

  async markFailed(scheduleId: number, type: NotificationType): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE notification_dispatch
        SET status = 'FAILED'
      WHERE schedule_id = ${scheduleId} AND type = ${type} AND claimed_by = ${this.claimedBy}
    `);
  }
}

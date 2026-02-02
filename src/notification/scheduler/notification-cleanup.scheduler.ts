import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { Cron } from "@nestjs/schedule";
import { NINETY_DAYS_MS } from "src/common/utils/date.util";

@Injectable()
export class NotificationCleanupScheduler {
  private readonly logger = new Logger(NotificationCleanupScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron("0 3 * * *", { timeZone: "Asia/Seoul" })
  async deleteOldNotifications() {
    const cutoff = new Date(Date.now() - NINETY_DAYS_MS);
    const result = await this.prisma.notificationHistories.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    this.logger.log(
      `Deleted ${result.count} notifications older than 90 days`,
    );
  }
}

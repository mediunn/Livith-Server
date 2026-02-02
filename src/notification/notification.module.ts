import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './service/notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { FirebaseInitService } from './fcm/firebase-init.service';
import { NotificationQueueScheduler } from './scheduler/notification-queue.scheduler';
import { TicketingReminderScheduler } from './scheduler/ticketing-reminder.scheduler';
import { NotificationCleanupScheduler } from './scheduler/notification-cleanup.scheduler';
import { RecommendationModule } from 'src/recommendation/recommendation.module';

@Module({
  imports: [RecommendationModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    PrismaService,
    FirebaseInitService,
    NotificationQueueScheduler,
    TicketingReminderScheduler,
    NotificationCleanupScheduler,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

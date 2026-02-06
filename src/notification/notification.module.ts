import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './service/notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { FirebaseInitService } from './fcm/firebase-init.service';
import { NotificationQueueScheduler } from './scheduler/notification-queue.scheduler';
import { TicketingReminderScheduler } from './scheduler/ticketing-reminder.scheduler';
import { NotificationCleanupScheduler } from './scheduler/notification-cleanup.scheduler';
import { RecommendationModule } from 'src/recommendation/recommendation.module';
import { ArtistModule } from 'src/artist/artist.module';
import { UserModule } from 'src/user/user.module';
import { NotificationSettingsService } from './service/notification-settings.service';
import { FcmTokenService } from './service/fcm-token.service';
import { NotificationHistoryService } from './service/notification-history.service';
import { PushSenderService } from './service/push-sender.service';

@Module({
  imports: [RecommendationModule, ArtistModule, UserModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationSettingsService,
    FcmTokenService,
    NotificationHistoryService,
    PushSenderService,
    PrismaService,
    FirebaseInitService,
    NotificationQueueScheduler,
    TicketingReminderScheduler,
    NotificationCleanupScheduler,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

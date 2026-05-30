import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './service/notification.service';
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
import { ArtistConcertOpenStrategy } from './strategies/artist-concert-open.strategy';
import { ConcertInfoUpdateStrategy } from './strategies/concert-info-update.strategy';
import { InterestConcertStrategy } from './strategies/interest-concert.strategy';
import { RecommendationStrategy } from './strategies/recommendation.strategy';
import { TicketReminderStrategy } from './strategies/ticket-reminder.strategy';
import { NotificationStrategyService } from './strategies/notification-strategy.service';
import { InterestConcertNotificationScheduler } from './scheduler/interest-concert-notification.scheduler';
import { RecommendationNotificationScheduler } from './scheduler/recommendation-notification.scheduler';
import { MetricsModule } from '../metrics/metrics.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [
    RecommendationModule,
    ArtistModule,
    UserModule,
    MetricsModule,
    PrismaModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationSettingsService,
    FcmTokenService,
    NotificationHistoryService,
    PushSenderService,
    ArtistConcertOpenStrategy,
    ConcertInfoUpdateStrategy,
    InterestConcertStrategy,
    RecommendationStrategy,
    TicketReminderStrategy,
    NotificationStrategyService,
    FirebaseInitService,
    NotificationQueueScheduler,
    TicketingReminderScheduler,
    NotificationCleanupScheduler,
    InterestConcertNotificationScheduler,
    RecommendationNotificationScheduler,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

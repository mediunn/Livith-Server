import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationStrategy } from './notification-strategy.interface';
import { ArtistConcertOpenStrategy } from './artist-concert-open.strategy';
import { ConcertInfoUpdateStrategy } from './concert-info-update.strategy';
import { InterestConcertStrategy } from './interest-concert.strategy';
import { RecommendationStrategy } from './recommendation.strategy';
import { TicketReminderStrategy } from './ticket-reminder.strategy';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class NotificationStrategyService {
  private strategies: Map<NotificationType, NotificationStrategy>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly artistConcertOpenStrategy: ArtistConcertOpenStrategy,
    private readonly concertInfoUpdateStrategy: ConcertInfoUpdateStrategy,
    private readonly interestConcertStrategy: InterestConcertStrategy,
    private readonly recommendationStrategy: RecommendationStrategy,
  ) {
    this.strategies = new Map<NotificationType, NotificationStrategy>([
      [NotificationType.ARTIST_CONCERT_OPEN, artistConcertOpenStrategy],
      [NotificationType.CONCERT_INFO_UPDATE, concertInfoUpdateStrategy],
      [NotificationType.INTEREST_CONCERT, interestConcertStrategy],
      [NotificationType.RECOMMEND, recommendationStrategy],
    ]);
  }

  getStrategy(type: NotificationType): NotificationStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`No notification strategy found for type: ${type}`);
    }
    return strategy;
  }

  hasStrategy(type: NotificationType): boolean {
    return this.strategies.has(type);
  }

  /**
   * Ticket Reminder용 strategy(동적 타입)
   */
  createTicketReminderStrategy(type: NotificationType): TicketReminderStrategy {
    return new TicketReminderStrategy(this.prisma, type);
  }
}

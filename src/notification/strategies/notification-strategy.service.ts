import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationStrategy } from './notification-strategy.interface';
import { ArtistConcertOpenStrategy } from './artist-concert-open.strategy';
import { ConcertInfoUpdateStrategy } from './concert-info-update.strategy';
import { InterestConcertStrategy } from './interest-concert.strategy';
import { RecommendationStrategy } from './recommendation.strategy';
import { TicketReminderStrategy } from './ticket-reminder.strategy';

@Injectable()
export class NotificationStrategyService {
  private strategies: Map<NotificationType, NotificationStrategy>;

  constructor(
    private readonly artistConcertOpenStrategy: ArtistConcertOpenStrategy,
    private readonly concertInfoUpdateStrategy: ConcertInfoUpdateStrategy,
    private readonly interestConcertStrategy: InterestConcertStrategy,
    private readonly recommendationStrategy: RecommendationStrategy,
    private readonly ticketReminderStrategy: TicketReminderStrategy,
  ) {
    this.strategies = new Map<NotificationType, NotificationStrategy>([
      [NotificationType.ARTIST_CONCERT_OPEN, artistConcertOpenStrategy],
      [NotificationType.CONCERT_INFO_UPDATE_SETLIST, concertInfoUpdateStrategy],
      [NotificationType.CONCERT_INFO_UPDATE_MD, concertInfoUpdateStrategy],
      [NotificationType.CONCERT_INFO_UPDATE_DETAIL, concertInfoUpdateStrategy],
      [
        NotificationType.CONCERT_INFO_UPDATE_SCHEDULE,
        concertInfoUpdateStrategy,
      ],
      [NotificationType.CONCERT_INFO_UPDATE_TICKET, concertInfoUpdateStrategy],
      [NotificationType.INTEREST_CONCERT, interestConcertStrategy],
      [NotificationType.RECOMMEND, recommendationStrategy],
      [NotificationType.PRE_TICKETING_OPEN, ticketReminderStrategy],
      [NotificationType.GENERAL_TICKETING_OPEN, ticketReminderStrategy],
      [NotificationType.PRE_TICKETING_1D, ticketReminderStrategy],
      [NotificationType.GENERAL_TICKETING_1D, ticketReminderStrategy],
      [NotificationType.PRE_TICKETING_30MIN, ticketReminderStrategy],
      [NotificationType.GENERAL_TICKETING_30MIN, ticketReminderStrategy],
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
}

import { Module } from '@nestjs/common';
import { AppModuleV4 } from './v4/app.module';
import { AppModule as AppModuleV5 } from './v5/app.module';
// v4 controllers
import { AuthController as AuthControllerV4 } from './v4/auth/auth.controller';
import { ConcertController as ConcertControllerV4 } from './v4/concert/concert.controller';
import { HomeController as HomeControllerV4 } from './v4/home/home.controller';
import { SearchController as SearchControllerV4 } from './v4/search/search.controller';
import { SetlistController as SetlistControllerV4 } from './v4/setlist/setlist.controller';
import { SongController as SongControllerV4 } from './v4/song/song.controller';
import { CommentController as CommentControllerV4 } from './v4/comment/comment.controller';
import { UserController as UserControllerV4 } from './v4/user/user.controller';
// v5 controllers
import { AuthController as AuthControllerV5 } from './v5/auth/auth.controller';
import { ConcertController as ConcertControllerV5 } from './v5/concert/concert.controller';
import { HomeController as HomeControllerV5 } from './v5/home/home.controller';
import { SearchController as SearchControllerV5 } from './v5/search/search.controller';
import { SetlistController as SetlistControllerV5 } from './v5/setlist/setlist.controller';
import { SongController as SongControllerV5 } from './v5/song/song.controller';
import { CommentController as CommentControllerV5 } from './v5/comment/comment.controller';
import { UserController as UserControllerV5 } from './v5/user/user.controller';
import { GenreController } from './v5/genre/genre.controller';
import { NotificationController } from './v5/notification/notification.controller';
import { RecommendationController } from './v5/recommendation/recommendation.controller';

@Module({
  imports: [AppModuleV4, AppModuleV5],
  controllers: [
    // v4
    AuthControllerV4,
    ConcertControllerV4,
    HomeControllerV4,
    SearchControllerV4,
    SetlistControllerV4,
    SongControllerV4,
    CommentControllerV4,
    UserControllerV4,
    // v5
    AuthControllerV5,
    ConcertControllerV5,
    HomeControllerV5,
    SearchControllerV5,
    SetlistControllerV5,
    SongControllerV5,
    CommentControllerV5,
    UserControllerV5,
    GenreController,
    NotificationController,
    RecommendationController,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [PrismaModule],
  providers: [CalendarService, UserService],
  controllers: [CalendarController],
})
export class CalendarModule {}

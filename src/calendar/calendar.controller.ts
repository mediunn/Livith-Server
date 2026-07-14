import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { CalendarService } from './calendar.service';
import { GetMonthlyCalendarDto } from './dto/get-monthly-calendar.dto';
import { API_PREFIX } from 'src/common/constants/api-prefix';

@ApiTags('캘린더')
@Controller(`${API_PREFIX}/calendar`)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '월별 캘린더 조회',
    description: '월별 캘린더를 조회합니다.',
  })
  getMonthlyCalendar(
    @Query() query: GetMonthlyCalendarDto,
    @CurrentUser() user?: { userId: number },
  ) {
    return this.calendarService.getMonthlyCalendar(
      query.year,
      query.month,
      query.scheduleTypes,
      query.concertType,
      user?.userId,
    );
  }
}

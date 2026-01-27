import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from 'src/common/constants/api-prefix';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { CreateNotificationConsentDto } from './dto/request/create-notification-consent.dto';
import { CurrentUser } from '../common/decorator/current-user.decorator';




@ApiTags('알림')
@Controller(`${API_PREFIX}/notifications`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('settings')
  @ApiOperation({
    summary: '알림 설정 조회',
    description: '현재 로그인한 유저의 알림 설정을 조회합니다.',
  })
  async getNotificationSettings(@CurrentUser() user: JwtPayload) {
    return this.notificationService.getNotificationSettings(user.userId);
  }

  @Post('marketing-consent')
  @ApiOperation({
    summary: '마케팅 동의',
    description: '홍보성 알림 수신을 위한 마케팅 동의를 처리하고, 홍보성 알림을 자동으로 활성화합니다.',
  })
  async agreeMarketingConsent(@CurrentUser() user: JwtPayload){
    return this.notificationService.agreeMarketingConsent(user.userId);
  }

  @Post('consent')
  @ApiOperation({
    summary: '알림 동의',
    description: '개별 알림 타입에 대한 수신 동의를 처리합니다.',
  })
  async createNotificationConsent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateNotificationConsentDto,
  ) {
    return this.notificationService.createNotificationConsent(user.userId, dto.field, dto.isAgreed);
  }
}
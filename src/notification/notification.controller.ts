import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from 'src/common/constants/api-prefix';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationService } from './service/notification.service';
import { CreateNotificationConsentDto } from './dto/request/create-notification-consent.dto';
import { CurrentUser } from '../common/decorator/current-user.decorator';
import { GetNotificationDto } from './dto/request/get-notification.dto';
import { NotificationResponseDto } from './dto/response/notification-response.dto';
import { RegisterFcmTokenDto } from './dto/request/register-fcm-token.dto';
import { DeleteFcmTokenDto } from './dto/request/delete-fcm-token.dto';
import { TestNotificationDto } from './dto/request/test-notification.dto';
import { ForbiddenException } from '@nestjs/common';
import { NotificationStrategyService } from './strategies/notification-strategy.service';

@ApiTags('알림')
@Controller(`${API_PREFIX}/notifications`)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly strategyService: NotificationStrategyService,
  ) {}

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
    description:
      '홍보성 알림 수신을 위한 마케팅 동의를 처리하고, 홍보성 알림을 자동으로 활성화합니다.',
  })
  async agreeMarketingConsent(@CurrentUser() user: JwtPayload) {
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
    return this.notificationService.createNotificationConsent(
      user.userId,
      dto.field,
      dto.isAgreed,
    );
  }

  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  async getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() dto: GetNotificationDto,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationService.getNotifications(
      user.userId,
      dto.cursor,
      dto.size,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: '읽지 않는 알림 개수 조회' })
  async getUnreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationService.getUnreadCount(
      user.userId,
    );
    return { unreadCount };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.notificationService.markAsRead(user.userId, notificationId);
    return { success: true, message: '알림을 읽음 처리했습니다.' };
  }

  @Post('fcm-token')
  @ApiOperation({
    summary: 'FCM 토큰 등록',
    description:
      '앱이 실행될 때마다 호출됩니다. 이미 존재하는 토큰이면 updatedAt만 갱신하고, 새 토큰이면 INSERT합니다.(upsert)',
  })
  async registerFcmToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterFcmTokenDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.notificationService.registerFcmToken(user.userId, dto.token);
    return { success: true, message: 'FCM 토큰이 등록되었습니다.' };
  }

  @Delete('fcm-token')
  @ApiOperation({
    summary: 'FCM 토큰 삭제',
    description:
      '로그아웃 시 호출됩니다. 요청 바디로 삭제할 특정 토큰을 받거나, 토큰이 제공되지 않으면 해당 사용자의 모든 FCM 토큰을 삭제합니다.',
  })
  async deleteFcmToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DeleteFcmTokenDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.notificationService.deleteFcmToken(user.userId, dto.token);
    return {
      success: true,
      message: dto.token
        ? 'FCM 토큰이 삭제되었습니다.'
        : '모든 FCM 토큰이 삭제되었습니다.',
    };
  }

  @Post('test/send')
  @ApiOperation({
    summary: '테스트 알림 발송 ',
    description:
      'type 선택 -> strategy에 맞춰 발송',
  })
  async sendTestNotification(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TestNotificationDto,
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    title: string;
    content: string;
  }> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Not available in production');
    }

    const strategy = this.strategyService.getStrategy(dto.type);
    const message = await strategy.buildMessage({ concertId: dto.concertId });

    const result = await this.notificationService.sendPushNotification({
      type: dto.type,
      title: message.title,
      content: message.content,
      targetId: dto.concertId ? String(dto.concertId) : undefined,
      userIds: [user.userId],
    });

    return {
      success: result.sent > 0,
      sent: result.sent,
      failed: result.failed,
      title: message.title,
      content: message.content,
    };
  }
}

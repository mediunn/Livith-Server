import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from 'src/common/constants/api-prefix';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { CreateNotificationConsentDto } from './dto/request/create-notification-consent.dto';
import { CurrentUser } from '../common/decorator/current-user.decorator';
import { GetNotificationDto } from './dto/request/get-notification.dto';
import { NotificationResponseDto } from './dto/response/notification-response.dto';




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

  @Get()
  @ApiOperation({summary: '알림 목록 조회'})
  async getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() dto: GetNotificationDto,
  ): Promise<NotificationResponseDto[]>{
    return this.notificationService.getNotifications(user.userId, dto.cursor, dto.size);
  }

  @Get('unread-count')
  @ApiOperation({summary: '읽지 않는 알림 개수 조회'})
  async getUnreadCount(
    @CurrentUser() user: JwtPayload
  ): Promise<{unreadCount: number}>{
    const unreadCount = await this.notificationService.getUnreadCount(user.userId);
    return {unreadCount};
  }

  @Patch(':id/read')
  @ApiOperation({summary: '알림 읽음 처리'})
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<{success: boolean, message: string}>{
    await this.notificationService.markAsRead(user.userId, notificationId);
    return {success: true, message: '알림을 읽음 처리했습니다.'};
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  async deleteNotification(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.notificationService.deleteNotification(user.userId, notificationId);
    return { success: true, message: '알림을 삭제했습니다.' };
  } 
}
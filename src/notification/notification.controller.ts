import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { API_PREFIX } from "src/common/constants/api-prefix";
import { NotificationService } from "./notification.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UpdateNotficationSettingDto } from "./dto/request/update-notification-set.dto";
import { NotificationConsentDto } from "./dto/request/notification-consent.dto";

@ApiTags('알림')
@Controller(`${API_PREFIX}/notifications`)
export class NotificationController{
    constructor(private readonly notificationService: NotificationService){}

    @Get("settings")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '알림 설정 조회',
        description: '현재 로그인한 유저의 알림 설정을 조회합니다.',
    })
    async getNotificationSettings(@Req() req){
        const userId = req.user.userId;
        return this.notificationService.getNotificationSettings(userId);
    }

    @Patch('settings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '알림 설정 변경',
        description: '현재 로그인한 유저의 알림 설정을 변경합니다.',
    })
    async updateNotificationSettings(
        @Req() req,
        @Body() dto: UpdateNotficationSettingDto
    ){
        const userId = req.user.userId;
        return this.notificationService.updateNotficationSettings(userId, dto);
    }

    @Post('consent')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '홍보성 알림 동의',
        description: '홍보성 알림 수신에 동의합니다.',
    })
    async createNotificationConsent(
        @Req() req,
        @Body() dto: NotificationConsentDto
    ){
        const userId = req.user.userId;
        return this.notificationService.createNotificationConsent(userId, dto);
    }

}
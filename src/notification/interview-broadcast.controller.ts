import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from 'src/common/constants/api-prefix';
import { NotificationService } from './service/notification.service';

@ApiTags('알림')
@Controller(`${API_PREFIX}/notifications`)
export class InterviewBroadcastController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('interview-broadcast')
  @ApiOperation({
    summary: '인터뷰 안내 일괄 발송 (1회성, 인증 없음)',
    description:
      'benefitAlert=true 유저에게 인터뷰 안내 알림 발송.',
  })
  async interviewBroadcast(): Promise<{
    sent: number;
    failed: number;
    targetUserCount: number;
  }> {
    return this.notificationService.sendMarketingBroadcast({
      title: '📢 여러분 의견을 들려주세요!',
      content:
        'Livith 어떻게 사용하고 계신가요?\n인터뷰 참여하고 기프티콘 받아가세요!🎁',
      targetId:
        'https://docs.google.com/forms/d/e/1FAIpQLSedNsQ1vy80vtzUPATX2gJyjnBU9Cxo3wRCEG1qVTdNj4NWSA/viewform',
    });
  }
}

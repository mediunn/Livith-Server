import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { API_PREFIX } from 'src/common/constants/api-prefix';
import { ImageProxyService } from './image-proxy.service';

@Controller(`${API_PREFIX}`)
export class ImageProxyController {
  constructor(private readonly imageProxyService: ImageProxyService) {}

  @Get('image-proxy')
  async proxy(@Query('url') rawUrl: string, @Res() res: Response) {
    const urlStr = String(rawUrl ?? '');
    await this.imageProxyService.proxyToResponse(urlStr, res);
  }
}

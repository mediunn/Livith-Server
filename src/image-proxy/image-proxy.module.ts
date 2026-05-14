import { Module } from '@nestjs/common';
import { ImageProxyController } from './image-proxy.controller';
import { ImageProxyService } from './image-proxy.service';

@Module({
  controllers: [ImageProxyController],
  providers: [ImageProxyService],
  exports: [ImageProxyService],
})
export class ImageProxyModule {}

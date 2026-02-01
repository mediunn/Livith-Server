import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { FirebaseInitService } from './firebase-init.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService, FirebaseInitService],
  exports: [NotificationService],
})
export class NotificationModule {}

import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { PrismaService } from 'prisma/prisma.service';
import { HomeService } from './home.service';

@Module({
  controllers: [HomeController],
  providers: [HomeService, PrismaService],
})
export class HomeModule {}

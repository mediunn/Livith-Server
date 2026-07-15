import { Module } from '@nestjs/common';
import { ConcertService } from './concert.service';
import { ConcertController } from './concert.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [PrismaModule, UserModule],
  providers: [ConcertService],
  controllers: [ConcertController],
})
export class ConcertModule {}

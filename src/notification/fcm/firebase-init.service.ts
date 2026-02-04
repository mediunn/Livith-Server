import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeFirebaseAdmin } from './firebase-admin';

@Injectable()
export class FirebaseInitService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    initializeFirebaseAdmin(this.configService);
  }
}

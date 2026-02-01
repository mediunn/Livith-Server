import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

let messaging: admin.messaging.Messaging | null = null;

export function initializeFirebaseAdmin(configService: ConfigService): void {
  if (admin.app.length > 0) return;

  const keyJson = configService.get<string>('FIREBASE_SERVICE_ACCOUNT_KEY');
  const keyPath = configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');

  if (keyJson) {
    try {
      const credential = admin.credential.cert(
        JSON.parse(keyJson) as admin.ServiceAccount,
      );
      admin.initializeApp({ credential });
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is invalid JSON.');
    }
  } else if (keyPath) {
    admin.initializeApp({ credential: admin.credential.cert(keyPath) });
  } else {
    throw new Error(
      'Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_ACCOUNT_PATH in env.',
    );
  }

  messaging = admin.messaging();
}

export function getMessaging(): admin.messaging.Messaging {
  if (!messaging) throw new Error('Firebase Admin is not initialized');
  return messaging;
}

export { admin };

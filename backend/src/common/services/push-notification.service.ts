import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('firebase.projectId');
    const privateKey = this.configService.get<string>('firebase.privateKey');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');

    if (projectId && privateKey && clientEmail && projectId !== 'your-firebase-project-id') {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              privateKey: privateKey.replace(/\\n/g, '\n'),
              clientEmail,
            }),
          });
        }
        this.initialized = true;
        this.logger.log('Firebase push notification service initialized');
      } catch (error) {
        this.logger.warn(`Firebase init failed: ${error.message}`);
      }
    } else {
      this.logger.warn('Firebase not configured, push notifications disabled');
    }
  }

  async sendToDevice(token: string, notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      await admin.messaging().send({
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        webpush: {
          notification: {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Push notification failed: ${error.message}`);
      return false;
    }
  }

  async sendToTokens(tokens: string[], notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    if (!this.initialized || tokens.length === 0) return;

    await Promise.allSettled(
      tokens.map((token) => this.sendToDevice(token, notification)),
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: any = null;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('sms.accountSid');
    const authToken = this.configService.get<string>('sms.authToken');

    if (accountSid && authToken && accountSid !== 'your-twilio-account-sid') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');
        this.client = twilio(accountSid, authToken);
        this.logger.log('Twilio SMS service initialized');
      } catch (error) {
        this.logger.warn(`Twilio init failed: ${error.message}`);
      }
    } else {
      this.logger.warn('Twilio not configured, SMS disabled');
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.client) return;

    try {
      const from = this.configService.get<string>('sms.phoneNumber');
      await this.client.messages.create({
        body: message,
        from,
        to: this.formatPhoneNumber(to),
      });
      this.logger.log(`SMS sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
    }
  }

  async sendUrgentNotification(to: string, title: string, message: string): Promise<void> {
    await this.sendSms(to, `URGENT: ${title}\n${message}`);
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone.startsWith('+')) {
      return `+${phone}`;
    }
    return phone;
  }
}

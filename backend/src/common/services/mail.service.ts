import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<number>('email.port') === 465,
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
    });
  }

  private get appName(): string {
    return this.configService.get<string>('appName', 'RMS Platform');
  }

  private get fromAddress(): string {
    const from = this.configService.get<string>('email.from', 'noreply@rms-platform.com');
    return `"${this.appName}" <${from}>`;
  }

  private baseTemplate(content: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${content}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">${this.appName}</p>
      </div>
    `;
  }

  private button(text: string, url: string): string {
    return `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}"
           style="background-color: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          ${text}
        </a>
      </div>
    `;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: `${this.appName} - ${subject}`,
        html,
      });
      this.logger.log(`Email "${subject}" sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send "${subject}" to ${to}: ${error.message}`);
    }
  }

  // ============ Authentication Emails ============

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const html = this.baseTemplate(`
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested a password reset for your ${this.appName} account.</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      ${this.button('Reset Password', resetUrl)}
      <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link: <br/>${resetUrl}</p>
    `);
    await this.send(to, 'Password Reset Request', html);
  }

  async sendWelcomeEmail(to: string, data: {
    firstName: string;
    role: string;
    loginUrl: string;
  }): Promise<void> {
    const html = this.baseTemplate(`
      <h2 style="color: #333;">Welcome to ${this.appName}!</h2>
      <p>Hi ${escapeHtml(data.firstName)},</p>
      <p>Your account has been created successfully as a <strong>${escapeHtml(data.role)}</strong>.</p>
      <p>You can now log in and start using the platform.</p>
      ${this.button('Log In to Your Account', data.loginUrl)}
      <p style="color: #666; font-size: 14px;">If you have any questions, feel free to reach out to your administrator.</p>
    `);
    await this.send(to, 'Welcome!', html);
  }

  async sendEmailVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const html = this.baseTemplate(`
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Please verify your email address by clicking the button below.</p>
      <p>This link expires in 24 hours.</p>
      ${this.button('Verify Email', verificationUrl)}
      <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link: <br/>${verificationUrl}</p>
    `);
    await this.send(to, 'Verify Your Email', html);
  }

  // ============ Sale Emails ============

  async sendSaleConfirmationToRealtor(to: string, data: {
    propertyTitle: string;
    salePrice: number;
    commissionAmount: number;
    clientName: string;
  }): Promise<void> {
    const html = this.baseTemplate(`
      <h2 style="color: #333;">Sale Confirmed!</h2>
      <p>Congratulations! Your sale has been approved.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Property</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.propertyTitle)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Client</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.clientName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Sale Price</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">$${data.salePrice.toLocaleString()}</td>
        </tr>
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;">Your Commission</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #16a34a;">$${data.commissionAmount.toLocaleString()}</td>
        </tr>
      </table>
      <p style="color: #666; font-size: 14px;">Check your dashboard for full details.</p>
    `);
    await this.send(to, 'Sale Confirmed', html);
  }

  async sendSaleConfirmationToClient(to: string, data: {
    propertyTitle: string;
    salePrice: number;
    realtorName: string;
  }): Promise<void> {
    const html = this.baseTemplate(`
      <h2 style="color: #333;">Purchase Confirmed!</h2>
      <p>Your property purchase has been approved.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Property</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.propertyTitle)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Price</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">$${data.salePrice.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Realtor</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.realtorName)}</td>
        </tr>
      </table>
      <p style="color: #666; font-size: 14px;">Log in to your dashboard to view documents and details.</p>
    `);
    await this.send(to, 'Purchase Confirmed', html);
  }

  // ============ Commission Emails ============

  async sendCommissionPaidEmail(to: string, data: {
    amount: number;
    propertyTitle: string;
    paidDate: Date;
  }): Promise<void> {
    const dateStr = new Date(data.paidDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const html = this.baseTemplate(`
      <h2 style="color: #333;">Commission Paid!</h2>
      <p>Your commission has been processed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Property</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.propertyTitle)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Amount</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #16a34a;">$${data.amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Paid On</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${dateStr}</td>
        </tr>
      </table>
    `);
    await this.send(to, 'Commission Paid', html);
  }

  // ============ Payment Emails ============

  async sendPaymentReminderEmail(to: string, data: {
    propertyTitle: string;
    dueAmount: number;
    dueDate: Date;
    overdueBy?: number;
  }): Promise<void> {
    const dateStr = new Date(data.dueDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const overdueText = data.overdueBy
      ? `<p style="color: #dc2626; font-weight: bold;">This payment is ${data.overdueBy} day${data.overdueBy > 1 ? 's' : ''} overdue.</p>`
      : '';
    const html = this.baseTemplate(`
      <h2 style="color: #333;">Payment Reminder</h2>
      <p>You have an upcoming payment due.</p>
      ${overdueText}
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Property</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.propertyTitle)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Amount Due</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">$${data.dueAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Due Date</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${dateStr}</td>
        </tr>
      </table>
      <p style="color: #666; font-size: 14px;">Please log in to your dashboard to make the payment.</p>
    `);
    await this.send(to, 'Payment Reminder', html);
  }

  // ============ HR Emails ============

  async sendLeaveApprovedEmail(to: string, data: {
    type: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
  }): Promise<void> {
    const start = new Date(data.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const end = new Date(data.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const html = this.baseTemplate(`
      <h2 style="color: #16a34a;">Leave Request Approved</h2>
      <p>Your leave request has been approved.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Type</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.type)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Period</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${start} - ${end}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Total Days</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.totalDays}</td>
        </tr>
      </table>
    `);
    await this.send(to, 'Leave Approved', html);
  }

  async sendLeaveRejectedEmail(to: string, data: {
    type: string;
    startDate: Date;
    endDate: Date;
    reason: string;
  }): Promise<void> {
    const start = new Date(data.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const end = new Date(data.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const html = this.baseTemplate(`
      <h2 style="color: #dc2626;">Leave Request Rejected</h2>
      <p>Your leave request has been declined.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Type</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.type)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Period</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${start} - ${end}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Reason</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.reason)}</td>
        </tr>
      </table>
      <p style="color: #666; font-size: 14px;">Please contact your manager for more details.</p>
    `);
    await this.send(to, 'Leave Rejected', html);
  }

  async sendTaskAssignedEmail(to: string, data: {
    title: string;
    description: string;
    dueDate?: Date;
    assignedBy: string;
  }): Promise<void> {
    const dueDateRow = data.dueDate
      ? `<tr>
          <td style="padding: 8px 0; color: #666;">Due Date</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${new Date(data.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>`
      : '';
    const html = this.baseTemplate(`
      <h2 style="color: #333;">New Task Assigned</h2>
      <p>You have been assigned a new task.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Task</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.title)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Assigned By</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.assignedBy)}</td>
        </tr>
        ${dueDateRow}
      </table>
      <p style="color: #666; font-size: 14px;">${escapeHtml(data.description)}</p>
    `);
    await this.send(to, 'New Task Assigned', html);
  }

  async sendPerformanceReviewEmail(to: string, data: {
    cycle: string;
    reviewerName: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<void> {
    const start = new Date(data.periodStart).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const end = new Date(data.periodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const html = this.baseTemplate(`
      <h2 style="color: #333;">Performance Review Scheduled</h2>
      <p>A performance review has been scheduled for you.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Review Cycle</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.cycle)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Period</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${start} - ${end}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Reviewer</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${escapeHtml(data.reviewerName)}</td>
        </tr>
      </table>
      <p style="color: #666; font-size: 14px;">Please prepare any relevant materials before your review.</p>
    `);
    await this.send(to, 'Performance Review Scheduled', html);
  }
}

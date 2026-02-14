import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommunicationService } from './communication.service';
import { CampaignEmailService } from './campaign-email.service';
import { PopupNotificationService } from './notification.service';
import { CampaignAnalyticsService } from './analytics.service';
import { CampaignSchedulerService } from './scheduler.service';
import {
  CreateSubscriberDto,
  UpdateSubscriberDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CreatePopupNotificationDto,
  CreateTemplateDto,
  CampaignQueryDto,
  SubscriberQueryDto,
} from './dto';

@ApiTags('Communication')
@Controller('communication')
export class CommunicationController {
  constructor(
    private readonly communicationService: CommunicationService,
    private readonly campaignEmailService: CampaignEmailService,
    private readonly notificationService: PopupNotificationService,
    private readonly analyticsService: CampaignAnalyticsService,
    private readonly schedulerService: CampaignSchedulerService,
  ) {}

  // ============================================================
  // SUBSCRIBER ENDPOINTS
  // ============================================================

  @Post('subscribers')
  @Public()
  @ApiOperation({ summary: 'Subscribe to email communications' })
  @ApiResponse({ status: 201, description: 'Subscribed successfully' })
  async subscribe(@Body() dto: CreateSubscriberDto) {
    return this.communicationService.createSubscriber(dto);
  }

  @Get('subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all subscribers' })
  async listSubscribers(@Query() query: SubscriberQueryDto) {
    return this.communicationService.getSubscribers(query);
  }

  @Get('subscribers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get subscriber details' })
  async getSubscriber(@Param('id') id: string) {
    return this.communicationService.getSubscriber(id);
  }

  @Put('subscribers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a subscriber' })
  async updateSubscriber(@Param('id') id: string, @Body() dto: UpdateSubscriberDto) {
    return this.communicationService.updateSubscriber(id, dto);
  }

  @Delete('subscribers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a subscriber' })
  async deleteSubscriber(@Param('id') id: string) {
    return this.communicationService.deleteSubscriber(id);
  }

  // ============================================================
  // UNSUBSCRIBE & TRACKING (Public)
  // ============================================================

  @Get('unsubscribe/:token')
  @Public()
  @ApiOperation({ summary: 'Unsubscribe via token' })
  async unsubscribe(@Param('token') token: string) {
    return this.campaignEmailService.unsubscribe(token);
  }

  @Get('track/open/:logId')
  @Public()
  @ApiOperation({ summary: 'Tracking pixel endpoint for email opens' })
  async trackOpen(@Param('logId') logId: string, @Res() res: Response) {
    await this.campaignEmailService.recordOpen(logId);
    // Return a 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set({ 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' });
    res.send(pixel);
  }

  @Get('track/click/:logId')
  @Public()
  @ApiOperation({ summary: 'Click tracking redirect' })
  async trackClick(@Param('logId') logId: string, @Query('url') url: string, @Res() res: Response) {
    await this.campaignEmailService.recordClick(logId);
    res.redirect(url || '/');
  }

  // ============================================================
  // CAMPAIGN ENDPOINTS
  // ============================================================

  @Post('campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new campaign' })
  async createCampaign(@Body() dto: CreateCampaignDto, @CurrentUser('id') userId: string) {
    return this.communicationService.createCampaign(dto, userId);
  }

  @Get('campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all campaigns' })
  async listCampaigns(@Query() query: CampaignQueryDto) {
    return this.communicationService.getCampaigns(query);
  }

  @Get('campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get campaign details' })
  async getCampaign(@Param('id') id: string) {
    return this.communicationService.getCampaign(id);
  }

  @Put('campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a campaign' })
  async updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.communicationService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a campaign' })
  async deleteCampaign(@Param('id') id: string) {
    return this.communicationService.deleteCampaign(id);
  }

  @Post('campaigns/:id/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Trigger a campaign to send immediately' })
  async sendCampaign(@Param('id') id: string) {
    await this.schedulerService.triggerCampaign(id);
    return { message: 'Campaign queued for sending' };
  }

  @Post('campaigns/:id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Pause a campaign' })
  async pauseCampaign(@Param('id') id: string) {
    return this.communicationService.updateCampaignStatus(id, 'PAUSED');
  }

  @Post('campaigns/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate a campaign' })
  async activateCampaign(@Param('id') id: string) {
    return this.communicationService.updateCampaignStatus(id, 'ACTIVE');
  }

  // ============================================================
  // CAMPAIGN ANALYTICS
  // ============================================================

  @Get('campaigns/:id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get analytics for a campaign' })
  async getCampaignAnalytics(@Param('id') id: string) {
    return this.analyticsService.getCampaignAnalytics(id);
  }

  @Get('analytics/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get communication dashboard stats' })
  async getDashboardAnalytics() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('analytics/ranking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get campaign performance ranking' })
  async getCampaignRanking(@Query('limit') limit?: number) {
    return this.analyticsService.getCampaignRanking(limit ? Number(limit) : 10);
  }

  @Get('analytics/engagement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get engagement breakdown by role' })
  async getEngagementByRole() {
    return this.analyticsService.getEngagementByRole();
  }

  // ============================================================
  // POPUP NOTIFICATIONS
  // ============================================================

  @Post('notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a popup notification' })
  async createNotification(@Body() dto: CreatePopupNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all popup notifications (admin)' })
  async listNotifications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('active') active?: string,
  ) {
    return this.notificationService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  @Get('notifications/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get active notifications for current user' })
  async getActiveNotifications(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.notificationService.getActiveForUser(userId, userRole);
  }

  @Post('notifications/:id/dismiss')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Dismiss a notification' })
  async dismissNotification(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationService.dismiss(id, userId);
  }

  @Put('notifications/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate a notification' })
  async deactivateNotification(@Param('id') id: string) {
    return this.notificationService.deactivate(id);
  }

  @Delete('notifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }

  // ============================================================
  // AI TEMPLATES
  // ============================================================

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create an AI content template' })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.communicationService.createTemplate(dto);
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all AI content templates' })
  async listTemplates() {
    return this.communicationService.getTemplates();
  }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an AI content template' })
  async deleteTemplate(@Param('id') id: string) {
    return this.communicationService.deleteTemplate(id);
  }

  // ============================================================
  // SCHEDULER / CRON TRIGGERS
  // ============================================================

  @Post('scheduler/scan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Trigger campaign scan and processing' })
  async triggerScan() {
    return this.schedulerService.scanAndEnqueue();
  }

  @Post('scheduler/birthdays')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Trigger birthday email processing' })
  async triggerBirthdays() {
    return this.schedulerService.processBirthdays();
  }

  @Get('scheduler/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GENERAL_OVERSEER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get queue stats' })
  async getQueueStats() {
    return this.schedulerService.getQueueStats();
  }
}

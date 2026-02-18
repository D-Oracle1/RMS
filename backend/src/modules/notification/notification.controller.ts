import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationType } from '@prisma/client';
import { SendCalloutDto, RespondCalloutDto } from './dto/send-callout.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isRead') isRead?: boolean,
    @Query('type') type?: NotificationType,
  ) {
    const parsedPage = page !== undefined && !isNaN(Number(page)) ? Number(page) : undefined;
    const parsedLimit = limit !== undefined && !isNaN(Number(limit)) ? Number(limit) : undefined;
    const parsedIsRead = isRead !== undefined ? String(isRead) === 'true' : undefined;
    return this.notificationService.findAll(userId, { page: parsedPage, limit: parsedLimit, isRead: parsedIsRead, type });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationService.delete(id, userId);
  }

  @Get('callout/staff')
  @ApiOperation({ summary: 'Get active staff members for callout' })
  @ApiResponse({ status: 200, description: 'List of active users' })
  async getCalloutStaff(@CurrentUser('id') currentUserId: string) {
    return this.notificationService.getCalloutStaff(currentUserId);
  }

  @Post('callout')
  @ApiOperation({ summary: 'Send a callout to a staff member' })
  @ApiResponse({ status: 201, description: 'Callout sent' })
  async sendCallout(
    @CurrentUser('id') callerId: string,
    @Body() data: SendCalloutDto,
  ) {
    return this.notificationService.sendCallout(callerId, data.targetUserId, data.message, data.link);
  }

  @Post('callout/:id/respond')
  @ApiOperation({ summary: 'Respond to a callout' })
  @ApiResponse({ status: 200, description: 'Response sent' })
  async respondToCallout(
    @Param('id') calloutId: string,
    @CurrentUser('id') responderId: string,
    @Body() data: RespondCalloutDto,
  ) {
    return this.notificationService.respondToCallout(calloutId, responderId, data.response);
  }
}

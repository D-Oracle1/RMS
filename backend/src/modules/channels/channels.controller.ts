import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChannelType } from '@prisma/client';

@ApiTags('Channels')
@Controller('channels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user channels' })
  @ApiResponse({ status: 200, description: 'List of channels' })
  async getChannels(@CurrentUser('id') userId: string) {
    return this.channelsService.getChannels(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a channel' })
  @ApiResponse({ status: 201, description: 'Channel created' })
  async createChannel(
    @CurrentUser('id') userId: string,
    @Body() data: {
      name: string;
      description?: string;
      type?: ChannelType;
      isPrivate?: boolean;
      departmentId?: string;
      memberUserIds?: string[];
    },
  ) {
    return this.channelsService.createChannel(userId, {
      ...data,
      type: data.type || 'GENERAL',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get channel details' })
  @ApiResponse({ status: 200, description: 'Channel details' })
  async getChannel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.channelsService.getChannel(id, userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get channel messages' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Channel messages' })
  async getMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.channelsService.getMessages(id, userId, { page, limit });
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message to channel' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: { content: string; parentId?: string },
  ) {
    return this.channelsService.sendMessage(id, userId, data);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add members to channel' })
  @ApiResponse({ status: 200, description: 'Members added' })
  async addMembers(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: { memberUserIds: string[] },
  ) {
    return this.channelsService.addMembers(id, userId, data.memberUserIds);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from channel' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.channelsService.removeMember(id, userId, memberId);
  }

  @Post(':id/messages/:messageId/pin')
  @ApiOperation({ summary: 'Toggle message pin' })
  @ApiResponse({ status: 200, description: 'Pin toggled' })
  async togglePin(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.channelsService.togglePin(id, userId, messageId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark channel as read' })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.channelsService.markAsRead(id, userId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a public channel' })
  @ApiResponse({ status: 200, description: 'Joined channel' })
  async joinChannel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.channelsService.joinChannel(id, userId);
  }
}

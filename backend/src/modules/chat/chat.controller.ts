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
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessageType } from '@prisma/client';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get user chat rooms' })
  @ApiResponse({ status: 200, description: 'List of chat rooms' })
  async getRooms(@CurrentUser('id') userId: string) {
    return this.chatService.getRooms(userId);
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Create a chat room' })
  @ApiResponse({ status: 201, description: 'Chat room created' })
  async createRoom(
    @CurrentUser('id') userId: string,
    @Body() data: { participantIds: string[]; name?: string },
  ) {
    return this.chatService.createRoom(userId, data.participantIds, data.name);
  }

  @Get('rooms/:roomId')
  @ApiOperation({ summary: 'Get chat room details' })
  @ApiResponse({ status: 200, description: 'Chat room details' })
  async getRoom(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getRoom(roomId, userId);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get chat room messages' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Chat messages' })
  async getMessages(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(roomId, userId, { page, limit });
  }

  @Post('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Body() data: { content: string; type?: MessageType; attachments?: any[] },
  ) {
    return this.chatService.sendMessage(roomId, userId, data);
  }

  @Post('rooms/:roomId/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.markAsRead(roomId, userId);
  }

  @Post('rooms/:roomId/participants')
  @ApiOperation({ summary: 'Add participants to group chat' })
  @ApiResponse({ status: 200, description: 'Participants added' })
  async addParticipants(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
    @Body() data: { participantIds: string[] },
  ) {
    return this.chatService.addParticipants(roomId, userId, data.participantIds);
  }

  @Delete('rooms/:roomId/participants/:participantId')
  @ApiOperation({ summary: 'Remove participant from group chat' })
  @ApiResponse({ status: 200, description: 'Participant removed' })
  async removeParticipant(
    @Param('roomId') roomId: string,
    @Param('participantId') participantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.removeParticipant(roomId, userId, participantId);
  }

  @Delete('rooms/:roomId')
  @ApiOperation({ summary: 'Delete chat room' })
  @ApiResponse({ status: 200, description: 'Chat room deleted' })
  async deleteRoom(
    @Param('roomId') roomId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.deleteRoom(roomId, userId);
  }
}

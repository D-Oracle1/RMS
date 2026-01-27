import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MessageType } from '@prisma/client';
import { WebsocketGateway } from '../../websocket/websocket.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async createRoom(creatorId: string, participantIds: string[], name?: string) {
    // Include creator in participants
    const allParticipants = [...new Set([creatorId, ...participantIds])];

    if (allParticipants.length < 2) {
      throw new BadRequestException('At least 2 participants required');
    }

    // Check if direct chat already exists between 2 users
    if (allParticipants.length === 2) {
      const existingRoom = await this.prisma.chatRoom.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              id: { in: allParticipants },
            },
          },
        },
        include: {
          participants: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      });

      if (existingRoom) {
        return existingRoom;
      }
    }

    const room = await this.prisma.chatRoom.create({
      data: {
        name,
        type: allParticipants.length === 2 ? 'DIRECT' : 'GROUP',
        participants: {
          connect: allParticipants.map((id) => ({ id })),
        },
      },
      include: {
        participants: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    return room;
  }

  async getRooms(userId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Calculate unread count for each room
    return Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            roomId: room.id,
            NOT: {
              readBy: { has: userId },
            },
            senderId: { not: userId },
          },
        });

        return {
          ...room,
          lastMessage: room.messages[0] || null,
          unreadCount,
        };
      }),
    );
  }

  async getRoom(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    return room;
  }

  async getMessages(roomId: string, userId: string, query: {
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    // Verify user is participant
    await this.getRoom(roomId, userId);

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { roomId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      this.prisma.message.count({ where: { roomId } }),
    ]);

    return {
      data: messages.reverse(),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(
    roomId: string,
    senderId: string,
    data: {
      content: string;
      type?: MessageType;
      attachments?: any[];
    },
  ) {
    // Verify user is participant
    await this.getRoom(roomId, senderId);

    const message = await this.prisma.message.create({
      data: {
        roomId,
        senderId,
        content: data.content,
        type: data.type || MessageType.TEXT,
        attachments: data.attachments,
        readBy: [senderId],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Update room's last message time
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { lastMessageAt: new Date() },
    });

    // Get room participants to send real-time update
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          select: { id: true },
        },
      },
    });

    // Send to all participants via WebSocket
    if (room) {
      for (const participant of room.participants) {
        if (participant.id !== senderId) {
          this.websocketGateway.sendToUser(participant.id, 'chat:message', {
            roomId,
            message,
          });
        }
      }
    }

    return message;
  }

  async markAsRead(roomId: string, userId: string) {
    // Verify user is participant
    await this.getRoom(roomId, userId);

    // Mark all unread messages as read
    await this.prisma.message.updateMany({
      where: {
        roomId,
        NOT: {
          readBy: { has: userId },
        },
      },
      data: {
        readBy: {
          push: userId,
        },
      },
    });

    return { success: true };
  }

  async deleteRoom(roomId: string, userId: string) {
    const room = await this.getRoom(roomId, userId);

    // Only allow deletion if user is participant
    await this.prisma.chatRoom.delete({
      where: { id: roomId },
    });

    return { message: 'Chat room deleted' };
  }

  async addParticipants(roomId: string, userId: string, participantIds: string[]) {
    const room = await this.getRoom(roomId, userId);

    if (room.type === 'DIRECT') {
      throw new BadRequestException('Cannot add participants to direct chat');
    }

    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        participants: {
          connect: participantIds.map((id) => ({ id })),
        },
      },
    });

    return this.getRoom(roomId, userId);
  }

  async removeParticipant(roomId: string, userId: string, participantId: string) {
    const room = await this.getRoom(roomId, userId);

    if (room.type === 'DIRECT') {
      throw new BadRequestException('Cannot remove participants from direct chat');
    }

    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        participants: {
          disconnect: { id: participantId },
        },
      },
    });

    return this.getRoom(roomId, userId);
  }
}

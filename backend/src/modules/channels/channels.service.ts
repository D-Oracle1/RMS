import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PusherService } from '../../common/services/pusher.service';
import { ChannelType } from '@prisma/client';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pusherService: PusherService,
  ) {}

  async getChannels(userId: string) {
    // Find user's staff profile
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      // Non-staff users: return public channels only
      const channels = await this.prisma.teamChannel.findMany({
        where: { isPrivate: false },
        include: {
          members: { select: { id: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true, senderId: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return channels.map((ch) => ({
        ...ch,
        memberCount: ch.members.length,
        lastMessage: ch.messages[0] || null,
        members: undefined,
        messages: undefined,
      }));
    }

    // Staff users: return channels they are a member of
    const channels = await this.prisma.teamChannel.findMany({
      where: {
        OR: [
          { members: { some: { staffProfileId: staffProfile.id } } },
          { isPrivate: false },
        ],
      },
      include: {
        members: {
          select: { id: true, staffProfileId: true, isAdmin: true, lastReadAt: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return channels.map((ch) => {
      const membership = ch.members.find((m) => m.staffProfileId === staffProfile.id);
      const unreadCount = membership?.lastReadAt
        ? 0 // We'll calculate properly below
        : ch.messages.length > 0 ? 1 : 0;

      return {
        ...ch,
        memberCount: ch.members.length,
        lastMessage: ch.messages[0] || null,
        isMember: !!membership,
        isChannelAdmin: membership?.isAdmin || false,
        members: undefined,
        messages: undefined,
      };
    });
  }

  async getChannel(channelId: string, userId: string) {
    const channel = await this.prisma.teamChannel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            staffProfile: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
                },
              },
            },
          },
        },
        department: { select: { id: true, name: true } },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }

  async createChannel(userId: string, data: {
    name: string;
    description?: string;
    type: ChannelType;
    isPrivate?: boolean;
    departmentId?: string;
    memberUserIds?: string[];
  }) {
    // Find creator's staff profile
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    const channel = await this.prisma.teamChannel.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type || 'GENERAL',
        isPrivate: data.isPrivate || false,
        createdById: userId,
        departmentId: data.departmentId,
      },
    });

    // Add creator as admin member if they have a staff profile
    if (staffProfile) {
      await this.prisma.channelMember.create({
        data: {
          channelId: channel.id,
          staffProfileId: staffProfile.id,
          isAdmin: true,
        },
      });
    }

    // Add other members
    if (data.memberUserIds && data.memberUserIds.length > 0) {
      const memberProfiles = await this.prisma.staffProfile.findMany({
        where: { userId: { in: data.memberUserIds } },
      });

      if (memberProfiles.length > 0) {
        await this.prisma.channelMember.createMany({
          data: memberProfiles
            .filter((p) => p.id !== staffProfile?.id)
            .map((p) => ({
              channelId: channel.id,
              staffProfileId: p.id,
              isAdmin: false,
            })),
          skipDuplicates: true,
        });
      }
    }

    return this.getChannel(channel.id, userId);
  }

  async getMessages(channelId: string, userId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    // Verify channel exists
    const channel = await this.prisma.teamChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const [messages, total] = await Promise.all([
      this.prisma.channelMessage.findMany({
        where: { channelId, parentId: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reactions: true,
          replies: {
            select: { id: true },
          },
        },
      }),
      this.prisma.channelMessage.count({ where: { channelId, parentId: null } }),
    ]);

    // Get sender info for all messages
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = await this.prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, firstName: true, lastName: true, avatar: true },
    });
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const enrichedMessages = messages.map((msg) => ({
      ...msg,
      sender: senderMap.get(msg.senderId) || null,
      replyCount: msg.replies.length,
      replies: undefined,
    }));

    return {
      data: enrichedMessages.reverse(),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async sendMessage(channelId: string, userId: string, data: {
    content: string;
    parentId?: string;
  }) {
    const channel = await this.prisma.teamChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const message = await this.prisma.channelMessage.create({
      data: {
        channelId,
        senderId: userId,
        content: data.content,
        parentId: data.parentId,
      },
    });

    // Update channel timestamp
    await this.prisma.teamChannel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });

    // Get sender info
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, avatar: true },
    });

    const enrichedMessage = { ...message, sender };

    // Broadcast to channel members via Pusher
    this.pusherService.sendToChatRoom(channelId, 'channel:message', {
      channelId,
      message: enrichedMessage,
    });

    return enrichedMessage;
  }

  async addMembers(channelId: string, userId: string, memberUserIds: string[]) {
    const channel = await this.prisma.teamChannel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is channel admin or channel creator
    const staffProfile = await this.prisma.staffProfile.findUnique({ where: { userId } });
    const isAdmin = channel.createdById === userId ||
      (staffProfile && channel.members.some((m) => m.staffProfileId === staffProfile.id && m.isAdmin));

    if (!isAdmin) {
      throw new ForbiddenException('Only channel admins can add members');
    }

    const memberProfiles = await this.prisma.staffProfile.findMany({
      where: { userId: { in: memberUserIds } },
    });

    if (memberProfiles.length === 0) {
      throw new BadRequestException('No valid staff profiles found for the given user IDs');
    }

    await this.prisma.channelMember.createMany({
      data: memberProfiles.map((p) => ({
        channelId,
        staffProfileId: p.id,
        isAdmin: false,
      })),
      skipDuplicates: true,
    });

    return this.getChannel(channelId, userId);
  }

  async removeMember(channelId: string, userId: string, memberId: string) {
    const channel = await this.prisma.teamChannel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const staffProfile = await this.prisma.staffProfile.findUnique({ where: { userId } });
    const isAdmin = channel.createdById === userId ||
      (staffProfile && channel.members.some((m) => m.staffProfileId === staffProfile.id && m.isAdmin));

    if (!isAdmin) {
      throw new ForbiddenException('Only channel admins can remove members');
    }

    await this.prisma.channelMember.delete({
      where: { id: memberId },
    }).catch(() => {
      throw new NotFoundException('Member not found');
    });

    return { success: true };
  }

  async togglePin(channelId: string, userId: string, messageId: string) {
    const message = await this.prisma.channelMessage.findFirst({
      where: { id: messageId, channelId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const updated = await this.prisma.channelMessage.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
    });

    return updated;
  }

  async markAsRead(channelId: string, userId: string) {
    const staffProfile = await this.prisma.staffProfile.findUnique({ where: { userId } });
    if (!staffProfile) return { success: true };

    await this.prisma.channelMember.updateMany({
      where: { channelId, staffProfileId: staffProfile.id },
      data: { lastReadAt: new Date() },
    });

    return { success: true };
  }

  async joinChannel(channelId: string, userId: string) {
    const channel = await this.prisma.teamChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.isPrivate) {
      throw new ForbiddenException('Cannot join a private channel without an invite');
    }

    const staffProfile = await this.prisma.staffProfile.findUnique({ where: { userId } });
    if (!staffProfile) {
      throw new BadRequestException('Staff profile required to join channels');
    }

    await this.prisma.channelMember.create({
      data: {
        channelId,
        staffProfileId: staffProfile.id,
        isAdmin: false,
      },
    }).catch(() => {
      // Already a member - ignore
    });

    return this.getChannel(channelId, userId);
  }
}

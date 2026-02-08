import { Injectable, Logger } from '@nestjs/common';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
  private readonly logger = new Logger(PusherService.name);
  private readonly pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || 'us2',
      useTLS: true,
    });
  }

  /** Send event to a specific user via their private channel */
  sendToUser(userId: string, event: string, data: any) {
    this.pusher
      .trigger(`private-user-${userId}`, event, data)
      .catch((err) => this.logger.error(`Failed to send to user ${userId}: ${err.message}`));
  }

  /** Send event to all users with a specific role */
  sendToRole(role: string, event: string, data: any) {
    this.pusher
      .trigger(`private-role-${role}`, event, data)
      .catch((err) => this.logger.error(`Failed to send to role ${role}: ${err.message}`));
  }

  /** Send event to all admins (ADMIN and SUPER_ADMIN roles) */
  sendToAdmins(event: string, data: any) {
    this.pusher
      .trigger(['private-role-ADMIN', 'private-role-SUPER_ADMIN'], event, data)
      .catch((err) => this.logger.error(`Failed to send to admins: ${err.message}`));
  }

  /** Broadcast event to all connected clients */
  broadcast(event: string, data: any) {
    this.pusher
      .trigger('public-broadcast', event, data)
      .catch((err) => this.logger.error(`Failed to broadcast: ${err.message}`));
  }

  /** Send event to a chat room's presence channel */
  sendToChatRoom(roomId: string, event: string, data: any) {
    this.pusher
      .trigger(`presence-chat-${roomId}`, event, data)
      .catch((err) => this.logger.error(`Failed to send to chat room ${roomId}: ${err.message}`));
  }

  /** Send a dashboard update event */
  sendDashboardUpdate(dashboard: string, data: any) {
    this.pusher
      .trigger(`private-dashboard-${dashboard}`, 'dashboard:update', data)
      .catch((err) => this.logger.error(`Failed to send dashboard update: ${err.message}`));
  }

  /** Send property update event */
  sendPropertyUpdate(propertyId: string, event: string, data: any) {
    this.pusher
      .trigger(`private-property-${propertyId}`, event, data)
      .catch((err) => this.logger.error(`Failed to send property update: ${err.message}`));
  }

  /** Authenticate a channel subscription (for private/presence channels) */
  authorizeChannel(socketId: string, channel: string, presenceData?: { user_id: string; user_info?: any }) {
    if (channel.startsWith('presence-') && presenceData) {
      return this.pusher.authorizeChannel(socketId, channel, presenceData);
    }
    return this.pusher.authorizeChannel(socketId, channel);
  }

  /** Get users currently connected to a presence channel */
  async getPresenceUsers(channel: string): Promise<string[]> {
    try {
      const response = await this.pusher.get({ path: `/channels/${channel}/users` });
      if (response.status === 200) {
        const body = await response.json() as { users: { id: string }[] };
        return body.users.map((u) => u.id);
      }
      return [];
    } catch {
      return [];
    }
  }
}

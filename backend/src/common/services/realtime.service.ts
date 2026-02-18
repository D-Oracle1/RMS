import { Injectable, Logger } from '@nestjs/common';

/**
 * Realtime broadcast service using Supabase's REST broadcast API.
 * This approach is serverless-friendly — no WebSocket connections needed.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private broadcastUrl: string | null = null;
  private apiKey: string | null = null;

  private ensureInitialized(): boolean {
    if (this.broadcastUrl) return true;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && key) {
      this.broadcastUrl = `${url}/realtime/v1/api/broadcast`;
      this.apiKey = key;
      this.logger.log('Supabase Realtime REST broadcast initialized');
      return true;
    }

    this.logger.warn('Supabase credentials not configured, realtime disabled');
    return false;
  }

  private async broadcast(channelName: string, event: string, data: any) {
    if (!this.ensureInitialized()) return;

    try {
      const res = await fetch(this.broadcastUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          apikey: this.apiKey!,
        },
        body: JSON.stringify({
          messages: [
            {
              topic: channelName,
              event,
              payload: data,
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`Broadcast HTTP ${res.status} on ${channelName}: ${body}`);
      }
    } catch (error: any) {
      this.logger.error(`Broadcast failed on ${channelName}: ${error.message}`);
    }
  }

  /** Send event to a specific user via their channel */
  async sendToUser(userId: string, event: string, data: any) {
    await this.broadcast(`user-${userId}`, event, data);
  }

  /** Send event to all users with a specific role */
  async sendToRole(role: string, event: string, data: any) {
    await this.broadcast(`role-${role}`, event, data);
  }

  /** Send event to all admins (ADMIN and SUPER_ADMIN roles) */
  async sendToAdmins(event: string, data: any) {
    await Promise.all([
      this.broadcast('role-ADMIN', event, data),
      this.broadcast('role-SUPER_ADMIN', event, data),
    ]);
  }

  /** Broadcast event to all connected clients */
  async broadcastToAll(event: string, data: any) {
    await this.broadcast('public-broadcast', event, data);
  }

  /** Send event to a chat room's channel */
  async sendToChatRoom(roomId: string, event: string, data: any) {
    await this.broadcast(`chat-${roomId}`, event, data);
  }

  /** Send a dashboard update event */
  async sendDashboardUpdate(dashboard: string, data: any) {
    await this.broadcast(`dashboard-${dashboard}`, 'dashboard:update', data);
  }

  /** Send property update event */
  async sendPropertyUpdate(propertyId: string, event: string, data: any) {
    await this.broadcast(`property-${propertyId}`, event, data);
  }
}

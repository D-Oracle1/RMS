import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedClients: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.role = payload.role;

      // Track connected client
      const existingSockets = this.connectedClients.get(payload.sub) || [];
      existingSockets.push(client.id);
      this.connectedClients.set(payload.sub, existingSockets);

      // Join user's personal room
      client.join(`user:${payload.sub}`);

      // Join role-based room
      client.join(`role:${payload.role}`);

      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to RMS WebSocket',
        userId: payload.sub,
        role: payload.role,
      });
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.connectedClients.get(client.userId) || [];
      const updatedSockets = sockets.filter((id) => id !== client.id);

      if (updatedSockets.length === 0) {
        this.connectedClients.delete(client.userId);
      } else {
        this.connectedClients.set(client.userId, updatedSockets);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Send to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Send to all users with specific role
  sendToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  // Send to all admins
  sendToAdmins(event: string, data: any) {
    this.server.to('role:ADMIN').to('role:SUPER_ADMIN').emit(event, data);
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Chat room events
  @SubscribeMessage('chat:join')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(`chat:${data.roomId}`);
    this.logger.log(`User ${client.userId} joined chat room ${data.roomId}`);
    return { success: true, roomId: data.roomId };
  }

  @SubscribeMessage('chat:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`chat:${data.roomId}`);
    this.logger.log(`User ${client.userId} left chat room ${data.roomId}`);
    return { success: true, roomId: data.roomId };
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    client.to(`chat:${data.roomId}`).emit('chat:typing', {
      userId: client.userId,
      roomId: data.roomId,
      isTyping: data.isTyping,
    });
  }

  // Send message to chat room
  sendToChatRoom(roomId: string, event: string, data: any) {
    this.server.to(`chat:${roomId}`).emit(event, data);
  }

  // Dashboard real-time updates
  @SubscribeMessage('dashboard:subscribe')
  handleDashboardSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { dashboard: string },
  ) {
    client.join(`dashboard:${data.dashboard}`);
    this.logger.log(`User ${client.userId} subscribed to ${data.dashboard} dashboard`);
    return { success: true };
  }

  sendDashboardUpdate(dashboard: string, data: any) {
    this.server.to(`dashboard:${dashboard}`).emit('dashboard:update', data);
  }

  // Property updates
  sendPropertyUpdate(propertyId: string, event: string, data: any) {
    this.server.to(`property:${propertyId}`).emit(event, data);
  }

  @SubscribeMessage('property:subscribe')
  handlePropertySubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { propertyId: string },
  ) {
    client.join(`property:${data.propertyId}`);
    return { success: true };
  }

  // Get online status
  isUserOnline(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}

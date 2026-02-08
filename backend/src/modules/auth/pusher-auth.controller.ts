import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PusherService } from '../../common/services/pusher.service';
import { Request } from 'express';

@ApiTags('Pusher')
@Controller('pusher')
export class PusherAuthController {
  constructor(private readonly pusherService: PusherService) {}

  @Post('auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async authenticate(@Req() req: Request & { user: { id: string; role: string; firstName?: string; lastName?: string; avatar?: string } }) {
    const { socket_id, channel_name } = req.body;
    const user = req.user;

    // For presence channels, include user info
    if (channel_name.startsWith('presence-')) {
      const presenceData = {
        user_id: user.id,
        user_info: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          avatar: user.avatar,
          role: user.role,
        },
      };
      const auth = this.pusherService.authorizeChannel(socket_id, channel_name, presenceData);
      return auth;
    }

    // For private channels, validate access
    if (channel_name.startsWith('private-user-')) {
      const channelUserId = channel_name.replace('private-user-', '');
      if (channelUserId !== user.id) {
        return { error: 'Forbidden' };
      }
    }

    if (channel_name.startsWith('private-role-')) {
      const channelRole = channel_name.replace('private-role-', '');
      if (channelRole !== user.role && user.role !== 'SUPER_ADMIN') {
        return { error: 'Forbidden' };
      }
    }

    const auth = this.pusherService.authorizeChannel(socket_id, channel_name);
    return auth;
  }
}

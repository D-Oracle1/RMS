import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RealtimeService } from '../../common/services/realtime.service';
import { Request } from 'express';

@ApiTags('Call')
@Controller('call')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CallController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a call' })
  async initiateCall(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { targetUserId: string; callType: 'audio' | 'video'; callerName: string; callerAvatar?: string },
  ) {
    await this.realtimeService.sendToUser(data.targetUserId, 'call:incoming', {
      callerId: req.user.id,
      callerName: data.callerName,
      callerAvatar: data.callerAvatar,
      callType: data.callType,
    });
    return { success: true };
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept a call' })
  async acceptCall(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { callerId: string; accepterName: string },
  ) {
    await this.realtimeService.sendToUser(data.callerId, 'call:accepted', {
      accepterId: req.user.id,
      accepterName: data.accepterName,
    });
    return { success: true };
  }

  @Post('reject')
  @ApiOperation({ summary: 'Reject a call' })
  async rejectCall(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { callerId: string },
  ) {
    await this.realtimeService.sendToUser(data.callerId, 'call:rejected', {
      rejecterId: req.user.id,
    });
    return { success: true };
  }

  @Post('end')
  @ApiOperation({ summary: 'End a call' })
  async endCall(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { peerId: string },
  ) {
    await this.realtimeService.sendToUser(data.peerId, 'call:ended', {
      endedBy: req.user.id,
    });
    return { success: true };
  }

  @Post('offer')
  @ApiOperation({ summary: 'Send WebRTC offer' })
  async sendOffer(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { targetUserId: string; offer: any },
  ) {
    await this.realtimeService.sendToUser(data.targetUserId, 'call:offer', {
      callerId: req.user.id,
      offer: data.offer,
    });
    return { success: true };
  }

  @Post('answer')
  @ApiOperation({ summary: 'Send WebRTC answer' })
  async sendAnswer(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { targetUserId: string; answer: any },
  ) {
    await this.realtimeService.sendToUser(data.targetUserId, 'call:answer', {
      answererId: req.user.id,
      answer: data.answer,
    });
    return { success: true };
  }

  @Post('ice-candidate')
  @ApiOperation({ summary: 'Send ICE candidate' })
  async sendIceCandidate(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { targetUserId: string; candidate: any },
  ) {
    await this.realtimeService.sendToUser(data.targetUserId, 'call:ice-candidate', {
      senderId: req.user.id,
      candidate: data.candidate,
    });
    return { success: true };
  }
}

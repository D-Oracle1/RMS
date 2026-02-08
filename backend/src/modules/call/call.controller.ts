import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PusherService } from '../../common/services/pusher.service';
import { Request } from 'express';

@ApiTags('Call')
@Controller('call')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CallController {
  constructor(private readonly pusherService: PusherService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a call' })
  initiateCall(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { targetUserId: string; callType: 'audio' | 'video'; callerName: string; callerAvatar?: string },
  ) {
    this.pusherService.sendToUser(data.targetUserId, 'call:incoming', {
      callerId: req.user.id,
      callerName: data.callerName,
      callerAvatar: data.callerAvatar,
      callType: data.callType,
    });
    return { success: true };
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept a call' })
  acceptCall(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { callerId: string; accepterName: string },
  ) {
    this.pusherService.sendToUser(data.callerId, 'call:accepted', {
      accepterId: req.user.id,
      accepterName: data.accepterName,
    });
    return { success: true };
  }

  @Post('reject')
  @ApiOperation({ summary: 'Reject a call' })
  rejectCall(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { callerId: string },
  ) {
    this.pusherService.sendToUser(data.callerId, 'call:rejected', {
      rejecterId: req.user.id,
    });
    return { success: true };
  }

  @Post('end')
  @ApiOperation({ summary: 'End a call' })
  endCall(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { peerId: string },
  ) {
    this.pusherService.sendToUser(data.peerId, 'call:ended', {
      endedBy: req.user.id,
    });
    return { success: true };
  }

  @Post('offer')
  @ApiOperation({ summary: 'Send WebRTC offer' })
  sendOffer(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { targetUserId: string; offer: any },
  ) {
    this.pusherService.sendToUser(data.targetUserId, 'call:offer', {
      callerId: req.user.id,
      offer: data.offer,
    });
    return { success: true };
  }

  @Post('answer')
  @ApiOperation({ summary: 'Send WebRTC answer' })
  sendAnswer(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { targetUserId: string; answer: any },
  ) {
    this.pusherService.sendToUser(data.targetUserId, 'call:answer', {
      answererId: req.user.id,
      answer: data.answer,
    });
    return { success: true };
  }

  @Post('ice-candidate')
  @ApiOperation({ summary: 'Send ICE candidate' })
  sendIceCandidate(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { targetUserId: string; candidate: any },
  ) {
    this.pusherService.sendToUser(data.targetUserId, 'call:ice-candidate', {
      senderId: req.user.id,
      candidate: data.candidate,
    });
    return { success: true };
  }
}

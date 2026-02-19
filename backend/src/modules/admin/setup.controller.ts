import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('director')
  @ApiOperation({ summary: 'Create or reset the Director (General Overseer) account' })
  @ApiResponse({ status: 200, description: 'Director account created/reset' })
  async setupDirector(@Body() body: { email: string; password: string; firstName?: string; lastName?: string }) {
    const { email, password, firstName = 'General', lastName = 'Overseer' } = body;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        role: UserRole.GENERAL_OVERSEER,
        firstName,
        lastName,
      },
      create: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: '+0000000000',
        role: UserRole.GENERAL_OVERSEER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        referralCode: 'REF-DIRECTOR01',
      },
      select: { id: true, email: true, role: true, status: true, firstName: true, lastName: true },
    });

    return {
      message: 'Director account ready',
      user,
    };
  }
}

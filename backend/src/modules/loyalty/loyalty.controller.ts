import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('my')
  @Roles('REALTOR')
  @ApiOperation({ summary: 'Get current realtor loyalty status' })
  @ApiResponse({ status: 200, description: 'Loyalty status' })
  async getMyLoyalty(@CurrentUser('id') userId: string) {
    // Get realtor profile by user ID
    return this.loyaltyService.getRealtorLoyalty(userId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get loyalty leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Loyalty leaderboard' })
  async getLeaderboard(@Query('limit') limit?: number) {
    return this.loyaltyService.getLeaderboard(limit);
  }

  @Get('distribution')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get tier distribution' })
  @ApiResponse({ status: 200, description: 'Tier distribution' })
  async getTierDistribution() {
    return this.loyaltyService.getTierDistribution();
  }

  @Get(':realtorId')
  @ApiOperation({ summary: 'Get realtor loyalty status' })
  @ApiResponse({ status: 200, description: 'Loyalty status' })
  async getRealtorLoyalty(@Param('realtorId') realtorId: string) {
    return this.loyaltyService.getRealtorLoyalty(realtorId);
  }
}

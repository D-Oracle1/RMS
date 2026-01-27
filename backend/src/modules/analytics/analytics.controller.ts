import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Get sales analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  @ApiResponse({ status: 200, description: 'Sales analytics' })
  async getSalesAnalytics(
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ) {
    return this.analyticsService.getSalesAnalytics(period);
  }

  @Get('properties')
  @ApiOperation({ summary: 'Get property analytics' })
  @ApiResponse({ status: 200, description: 'Property analytics' })
  async getPropertyAnalytics() {
    return this.analyticsService.getPropertyAnalytics();
  }

  @Get('realtors')
  @ApiOperation({ summary: 'Get realtor analytics' })
  @ApiResponse({ status: 200, description: 'Realtor analytics' })
  async getRealtorAnalytics() {
    return this.analyticsService.getRealtorAnalytics();
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Get commission analytics' })
  @ApiResponse({ status: 200, description: 'Commission analytics' })
  async getCommissionAnalytics() {
    return this.analyticsService.getCommissionAnalytics();
  }

  @Get('market-trends')
  @ApiOperation({ summary: 'Get market trends' })
  @ApiResponse({ status: 200, description: 'Market trends' })
  async getMarketTrends() {
    return this.analyticsService.getMarketTrends();
  }
}

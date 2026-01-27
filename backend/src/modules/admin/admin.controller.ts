import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LoyaltyTier } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('realtors')
  @ApiOperation({ summary: 'Get realtor monitoring data' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tier', required: false, enum: LoyaltyTier })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Realtor monitoring data' })
  async getRealtorMonitoring(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('tier') tier?: LoyaltyTier,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getRealtorMonitoring({
      page,
      limit,
      search,
      tier,
      sortBy,
      sortOrder,
    });
  }

  @Get('realtors/:id')
  @ApiOperation({ summary: 'Get realtor drill-down view' })
  @ApiResponse({ status: 200, description: 'Realtor details' })
  async getRealtorDrilldown(@Param('id') id: string) {
    return this.adminService.getRealtorDrilldown(id);
  }

  @Get('sales-feed')
  @ApiOperation({ summary: 'Get real-time sales feed' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent sales' })
  async getRecentSalesFeed(@Query('limit') limit?: number) {
    return this.adminService.getRecentSalesFeed(limit);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get performance analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  @ApiResponse({ status: 200, description: 'Performance analytics' })
  async getPerformanceAnalytics(
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ) {
    return this.adminService.getPerformanceAnalytics(period);
  }
}

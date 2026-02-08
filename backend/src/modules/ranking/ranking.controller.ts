import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RankingService } from './ranking.service';
import { StaffRankingService } from './staff-ranking.service';
import { ClientRankingService } from './client-ranking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RankingPeriod } from '@prisma/client';

@ApiTags('Rankings')
@Controller('rankings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RankingController {
  constructor(
    private readonly rankingService: RankingService,
    private readonly staffRankingService: StaffRankingService,
    private readonly clientRankingService: ClientRankingService,
  ) {}

  // ======== Realtor Rankings ========

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get realtor ranking leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: RankingPeriod })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Ranking leaderboard' })
  async getLeaderboard(
    @Query('period') period: RankingPeriod = 'MONTHLY',
    @Query('limit') limit?: number,
  ) {
    return this.rankingService.getLeaderboard(period, limit);
  }

  @Get('realtor-of-month')
  @ApiOperation({ summary: 'Get Realtor of the Month' })
  @ApiResponse({ status: 200, description: 'Realtor of the Month' })
  async getRealtorOfMonth() {
    return this.rankingService.getRealtorOfMonth();
  }

  @Get('realtor-of-year')
  @ApiOperation({ summary: 'Get Realtor of the Year' })
  @ApiResponse({ status: 200, description: 'Realtor of the Year' })
  async getRealtorOfYear() {
    return this.rankingService.getRealtorOfYear();
  }

  @Post('calculate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Manually trigger realtor ranking calculation' })
  @ApiQuery({ name: 'period', required: true, enum: RankingPeriod })
  @ApiResponse({ status: 200, description: 'Rankings calculated' })
  async calculateRankings(@Query('period') period: RankingPeriod) {
    await this.rankingService.calculateRankings(period);
    return { message: 'Realtor rankings calculated successfully' };
  }

  // ======== Staff Rankings ========

  @Get('staff/leaderboard')
  @ApiOperation({ summary: 'Get staff ranking leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: RankingPeriod })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Staff ranking leaderboard' })
  async getStaffLeaderboard(
    @Query('period') period: RankingPeriod = 'MONTHLY',
    @Query('limit') limit?: number,
  ) {
    return this.staffRankingService.getStaffLeaderboard(period, limit);
  }

  @Get('staff-of-month')
  @ApiOperation({ summary: 'Get Staff of the Month' })
  @ApiResponse({ status: 200, description: 'Staff of the Month' })
  async getStaffOfMonth() {
    return this.staffRankingService.getStaffOfMonth();
  }

  @Get('staff-of-year')
  @ApiOperation({ summary: 'Get Staff of the Year' })
  @ApiResponse({ status: 200, description: 'Staff of the Year' })
  async getStaffOfYear() {
    return this.staffRankingService.getStaffOfYear();
  }

  @Post('staff/calculate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Manually trigger staff ranking calculation' })
  @ApiQuery({ name: 'period', required: true, enum: RankingPeriod })
  @ApiResponse({ status: 200, description: 'Staff rankings calculated' })
  async calculateStaffRankings(@Query('period') period: RankingPeriod) {
    await this.staffRankingService.calculateStaffRankings(period);
    return { message: 'Staff rankings calculated successfully' };
  }

  // ======== Client Rankings ========

  @Get('clients/leaderboard')
  @ApiOperation({ summary: 'Get client ranking leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: RankingPeriod })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Client ranking leaderboard' })
  async getClientLeaderboard(
    @Query('period') period: RankingPeriod = 'MONTHLY',
    @Query('limit') limit?: number,
  ) {
    return this.clientRankingService.getClientLeaderboard(period, limit);
  }

  @Get('client-of-month')
  @ApiOperation({ summary: 'Get Client of the Month' })
  @ApiResponse({ status: 200, description: 'Client of the Month' })
  async getClientOfMonth() {
    return this.clientRankingService.getClientOfMonth();
  }

  @Get('client-of-year')
  @ApiOperation({ summary: 'Get Client of the Year' })
  @ApiResponse({ status: 200, description: 'Client of the Year' })
  async getClientOfYear() {
    return this.clientRankingService.getClientOfYear();
  }

  @Post('clients/calculate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Manually trigger client ranking calculation' })
  @ApiQuery({ name: 'period', required: true, enum: RankingPeriod })
  @ApiResponse({ status: 200, description: 'Client rankings calculated' })
  async calculateClientRankings(@Query('period') period: RankingPeriod) {
    await this.clientRankingService.calculateClientRankings(period);
    return { message: 'Client rankings calculated successfully' };
  }

  // ======== Individual Ranking History (catch-all routes MUST be last) ========

  @Get('staff/:staffProfileId')
  @ApiOperation({ summary: 'Get staff member ranking history' })
  @ApiResponse({ status: 200, description: 'Staff ranking history' })
  async getStaffRanking(@Param('staffProfileId') id: string) {
    return this.staffRankingService.getStaffRanking(id);
  }

  @Get('clients/:clientProfileId')
  @ApiOperation({ summary: 'Get client ranking history' })
  @ApiResponse({ status: 200, description: 'Client ranking history' })
  async getClientRanking(@Param('clientProfileId') id: string) {
    return this.clientRankingService.getClientRanking(id);
  }

  @Get(':realtorId')
  @ApiOperation({ summary: 'Get realtor ranking history' })
  @ApiResponse({ status: 200, description: 'Realtor ranking history' })
  async getRealtorRanking(@Param('realtorId') realtorId: string) {
    return this.rankingService.getRealtorRanking(realtorId);
  }
}

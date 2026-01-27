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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RankingPeriod } from '@prisma/client';

@ApiTags('Rankings')
@Controller('rankings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get ranking leaderboard' })
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

  @Get(':realtorId')
  @ApiOperation({ summary: 'Get realtor ranking history' })
  @ApiResponse({ status: 200, description: 'Realtor ranking history' })
  async getRealtorRanking(@Param('realtorId') realtorId: string) {
    return this.rankingService.getRealtorRanking(realtorId);
  }

  @Post('calculate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Manually trigger ranking calculation' })
  @ApiQuery({ name: 'period', required: true, enum: RankingPeriod })
  @ApiResponse({ status: 200, description: 'Rankings calculated' })
  async calculateRankings(@Query('period') period: RankingPeriod) {
    await this.rankingService.calculateRankings(period);
    return { message: 'Rankings calculated successfully' };
  }
}

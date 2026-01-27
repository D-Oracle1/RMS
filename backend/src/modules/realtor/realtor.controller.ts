import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RealtorService } from './realtor.service';
import { UpdateRealtorDto } from './dto/update-realtor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LoyaltyTier } from '@prisma/client';

@ApiTags('Realtors')
@Controller('realtors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RealtorController {
  constructor(private readonly realtorService: RealtorService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all realtors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tier', required: false, enum: LoyaltyTier })
  @ApiResponse({ status: 200, description: 'List of realtors' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('tier') tier?: LoyaltyTier,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.realtorService.findAll({ page, limit, search, tier, sortBy, sortOrder });
  }

  @Get('dashboard')
  @Roles('REALTOR')
  @ApiOperation({ summary: 'Get realtor dashboard' })
  @ApiResponse({ status: 200, description: 'Realtor dashboard data' })
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.realtorService.getDashboard(userId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get realtor leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['monthly', 'yearly', 'all-time'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Realtor leaderboard' })
  async getLeaderboard(
    @Query('period') period: 'monthly' | 'yearly' | 'all-time' = 'monthly',
    @Query('limit') limit?: number,
  ) {
    return this.realtorService.getLeaderboard(period, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get realtor by ID' })
  @ApiResponse({ status: 200, description: 'Realtor details' })
  @ApiResponse({ status: 404, description: 'Realtor not found' })
  async findOne(@Param('id') id: string) {
    return this.realtorService.findById(id);
  }

  @Get(':id/clients')
  @ApiOperation({ summary: 'Get realtor clients' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Realtor clients' })
  async getClients(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.realtorService.getClients(id, { page, limit, search });
  }

  @Get(':id/properties')
  @ApiOperation({ summary: 'Get realtor properties' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Realtor properties' })
  async getProperties(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.realtorService.getProperties(id, { page, limit, status });
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'REALTOR')
  @ApiOperation({ summary: 'Update realtor profile' })
  @ApiResponse({ status: 200, description: 'Realtor updated' })
  async update(@Param('id') id: string, @Body() updateRealtorDto: UpdateRealtorDto) {
    return this.realtorService.update(id, updateRealtorDto);
  }
}

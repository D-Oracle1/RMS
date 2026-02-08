import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AwardService } from './award.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AwardType } from '@prisma/client';

@ApiTags('Awards')
@Controller('awards')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AwardController {
  constructor(private readonly awardService: AwardService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a monthly award' })
  @ApiResponse({ status: 201, description: 'Award created' })
  async create(@Body() dto: CreateAwardDto) {
    return this.awardService.create(dto);
  }

  @Patch(':id/publish')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Publish an award (makes it visible to the winner)' })
  @ApiResponse({ status: 200, description: 'Award published' })
  async publish(@Param('id') id: string) {
    return this.awardService.publish(id);
  }

  @Patch(':id/unpublish')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Unpublish an award (hides it from the winner)' })
  @ApiResponse({ status: 200, description: 'Award unpublished' })
  async unpublish(@Param('id') id: string) {
    return this.awardService.unpublish(id);
  }

  @Get('my-awards')
  @ApiOperation({ summary: 'Get current user awards' })
  @ApiResponse({ status: 200, description: 'User awards' })
  async getMyAwards(@CurrentUser('id') userId: string) {
    return this.awardService.getMyAwards(userId);
  }

  @Get('current-month')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get current month awards' })
  @ApiResponse({ status: 200, description: 'Current month awards' })
  async getCurrentMonthAwards() {
    return this.awardService.getCurrentMonthAwards();
  }

  @Get('realtor-of-month')
  @ApiOperation({ summary: 'Get the published Realtor of the Month' })
  @ApiResponse({ status: 200, description: 'Published Realtor of the Month award' })
  async getPublishedRealtorOfMonth() {
    return this.awardService.getPublishedRealtorOfMonth();
  }

  @Get('staff-of-month')
  @ApiOperation({ summary: 'Get the published Staff of the Month' })
  @ApiResponse({ status: 200, description: 'Published Staff of the Month award' })
  async getPublishedStaffOfMonth() {
    return this.awardService.getPublishedOfMonth('STAFF_OF_MONTH');
  }

  @Get('client-of-month')
  @ApiOperation({ summary: 'Get the published Client of the Month' })
  @ApiResponse({ status: 200, description: 'Published Client of the Month award' })
  async getPublishedClientOfMonth() {
    return this.awardService.getPublishedOfMonth('CLIENT_OF_MONTH');
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List all awards' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: AwardType })
  @ApiResponse({ status: 200, description: 'Awards list' })
  async findAll(
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('type') type?: AwardType,
  ) {
    return this.awardService.findAll({
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      type,
    });
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete an award' })
  @ApiResponse({ status: 200, description: 'Award deleted' })
  async delete(@Param('id') id: string) {
    return this.awardService.delete(id);
  }
}

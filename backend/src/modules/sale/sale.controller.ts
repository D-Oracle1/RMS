import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SaleStatus } from '@prisma/client';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  @Roles('REALTOR')
  @ApiOperation({ summary: 'Record a new sale' })
  @ApiResponse({ status: 201, description: 'Sale recorded successfully' })
  async create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.saleService.create(createSaleDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'realtorId', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: SaleStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of sales' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('realtorId') realtorId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: SaleStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.saleService.findAll({
      page,
      limit,
      realtorId,
      clientId,
      status,
      startDate,
      endDate,
    });
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get sales statistics' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  @ApiResponse({ status: 200, description: 'Sales statistics' })
  async getStats(@Query('period') period?: 'week' | 'month' | 'quarter' | 'year') {
    return this.saleService.getStats(period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiResponse({ status: 200, description: 'Sale details' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async findOne(@Param('id') id: string) {
    return this.saleService.findById(id);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update sale status (confirm or cancel pending orders)' })
  @ApiResponse({ status: 200, description: 'Sale status updated' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateSaleStatusDto: UpdateSaleStatusDto,
  ) {
    return this.saleService.updateStatus(
      id,
      updateSaleStatusDto.status,
      updateSaleStatusDto.notes,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'REALTOR')
  @ApiOperation({ summary: 'Get all clients' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'realtorId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of clients' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('realtorId') realtorId?: string,
  ) {
    return this.clientService.findAll({ page, limit, search, realtorId });
  }

  @Get('dashboard')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Get client dashboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @ApiQuery({ name: 'month', required: false, type: Number, description: '0-11' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Client dashboard data' })
  async getDashboard(
    @CurrentUser('id') userId: string,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly' | 'yearly',
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.clientService.getDashboard(userId, period, month, year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({ status: 200, description: 'Client details' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async findOne(@Param('id') id: string) {
    return this.clientService.findById(id);
  }

  @Get(':id/properties')
  @ApiOperation({ summary: 'Get client properties' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isListed', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Client properties' })
  async getProperties(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isListed') isListed?: boolean,
  ) {
    return this.clientService.getProperties(id, { page, limit, isListed });
  }

  @Post(':id/properties/:propertyId/list')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'List property for sale' })
  @ApiResponse({ status: 200, description: 'Property listed' })
  async listProperty(
    @Param('id') id: string,
    @Param('propertyId') propertyId: string,
    @Body('listingPrice') listingPrice: number,
  ) {
    return this.clientService.listPropertyForSale(id, propertyId, listingPrice);
  }

  @Post(':id/properties/:propertyId/unlist')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Remove property listing' })
  @ApiResponse({ status: 200, description: 'Property unlisted' })
  async unlistProperty(
    @Param('id') id: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.clientService.removePropertyListing(id, propertyId);
  }

  @Get(':id/offers')
  @ApiOperation({ summary: 'Get offers on client properties' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Property offers' })
  async getOffers(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.clientService.getOffers(id, { page, limit, status });
  }

  @Post(':id/offers/:offerId/respond')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Respond to offer' })
  @ApiResponse({ status: 200, description: 'Offer response recorded' })
  async respondToOffer(
    @Param('id') id: string,
    @Param('offerId') offerId: string,
    @Body('response') response: 'accept' | 'reject' | 'counter',
    @Body('counterAmount') counterAmount?: number,
  ) {
    return this.clientService.respondToOffer(id, offerId, response, counterAmount);
  }
}

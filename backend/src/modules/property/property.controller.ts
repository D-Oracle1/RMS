import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { DocumentType } from '@prisma/client';
import { PropertyType, PropertyStatus } from '@prisma/client';

@ApiTags('Properties')
@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'REALTOR')
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertyService.create(createPropertyDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: PropertyType })
  @ApiQuery({ name: 'status', required: false, enum: PropertyStatus })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of properties' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('type') type?: PropertyType,
    @Query('status') status?: PropertyStatus,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minBedrooms') minBedrooms?: number,
    @Query('isListed') isListed?: boolean,
    @Query('realtorId') realtorId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.propertyService.findAll({
      page,
      limit,
      search,
      type,
      status,
      city,
      minPrice,
      maxPrice,
      minBedrooms,
      isListed,
      realtorId,
      sortBy,
      sortOrder,
    });
  }

  @Get('listed')
  @Public()
  @ApiOperation({ summary: 'Get listed properties (public)' })
  @ApiResponse({ status: 200, description: 'Listed properties' })
  async getListedProperties(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: PropertyType,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    return this.propertyService.getListedProperties({
      page,
      limit,
      type,
      city,
      minPrice,
      maxPrice,
    });
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get property statistics' })
  @ApiResponse({ status: 200, description: 'Property statistics' })
  async getStats() {
    return this.propertyService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  @ApiResponse({ status: 200, description: 'Property details' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async findOne(@Param('id') id: string) {
    return this.propertyService.findById(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'REALTOR')
  @ApiOperation({ summary: 'Update property' })
  @ApiResponse({ status: 200, description: 'Property updated' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertyService.update(id, updatePropertyDto, userId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete property' })
  @ApiResponse({ status: 200, description: 'Property deleted' })
  async delete(@Param('id') id: string) {
    return this.propertyService.delete(id);
  }

  @Post(':id/offers')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Submit offer on property' })
  @ApiResponse({ status: 201, description: 'Offer submitted' })
  async submitOffer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: { amount: number; message?: string; expiresInDays?: number },
  ) {
    // Get client profile ID from user
    return this.propertyService.submitOffer(id, userId, data);
  }

  @Post(':id/documents')
  @Roles('SUPER_ADMIN', 'ADMIN', 'REALTOR')
  @ApiOperation({ summary: 'Add document to property' })
  @ApiResponse({ status: 201, description: 'Document added' })
  async addDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: { type: DocumentType; name: string; url: string; size: number; mimeType: string },
  ) {
    return this.propertyService.addDocument(id, { ...data, uploadedBy: userId });
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // ── Public endpoints (no auth) ──

  @Get('resolve')
  @ApiOperation({ summary: 'Resolve company from current domain or invite code' })
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'code', required: false })
  @ApiResponse({ status: 200, description: 'Company info' })
  async resolve(
    @Query('domain') domain?: string,
    @Query('code') code?: string,
  ) {
    if (code) {
      return this.companyService.resolveByInviteCode(code);
    }
    if (domain) {
      return this.companyService.resolveByDomain(domain);
    }
    return null;
  }

  // ── SUPER_ADMIN endpoints ──

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new company (provisions dedicated DB)' })
  @ApiResponse({ status: 201, description: 'Company created' })
  async create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all companies' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Paginated companies list' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.companyService.findAll({ page, limit, search });
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get overview stats across all companies' })
  @ApiResponse({ status: 200, description: 'Aggregated stats' })
  async getOverview() {
    return this.companyService.getOverviewStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get company details' })
  @ApiResponse({ status: 200, description: 'Company detail with stats' })
  async findById(@Param('id') id: string) {
    return this.companyService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Updated company' })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle company active status' })
  @ApiResponse({ status: 200, description: 'Updated status' })
  async toggleActive(@Param('id') id: string) {
    return this.companyService.toggleActive(id);
  }

  @Post(':id/regenerate-invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Regenerate invite code for a company' })
  @ApiResponse({ status: 200, description: 'New invite code' })
  async regenerateInviteCode(@Param('id') id: string) {
    return this.companyService.regenerateInviteCode(id);
  }
}

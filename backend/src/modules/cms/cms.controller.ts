import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { UpsertCmsSectionDto } from './dto/upsert-cms-section.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('CMS')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ============ Public Endpoints (no auth) ============

  @Get('public')
  @ApiOperation({ summary: 'Get all CMS content for public pages' })
  @ApiResponse({ status: 200, description: 'All CMS sections' })
  async getPublicContent() {
    return this.cmsService.getPublicContent();
  }

  @Get('public/:key')
  @ApiOperation({ summary: 'Get a specific CMS section for public pages' })
  @ApiResponse({ status: 200, description: 'CMS section content' })
  async getPublicSection(@Param('key') key: string) {
    return this.cmsService.getSection(key);
  }

  // ============ Admin Endpoints ============

  @Get('sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all CMS sections for admin editing' })
  @ApiResponse({ status: 200, description: 'All CMS sections' })
  async getAllSections() {
    return this.cmsService.getAllSections();
  }

  @Get('sections/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a specific CMS section' })
  @ApiResponse({ status: 200, description: 'CMS section content' })
  async getSection(@Param('key') key: string) {
    return this.cmsService.getSection(key);
  }

  @Put('sections/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create or update a CMS section' })
  @ApiResponse({ status: 200, description: 'Section saved' })
  async upsertSection(
    @Param('key') key: string,
    @Body() dto: UpsertCmsSectionDto,
    @Req() req: any,
  ) {
    // Branding section is restricted to SUPER_ADMIN only
    if (key === 'branding' && req.user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can modify branding settings');
    }
    await this.cmsService.upsertSection(key, dto.content);
    return { success: true };
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { UpsertCmsSectionDto } from './dto/upsert-cms-section.dto';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ContentType } from '@prisma/client';

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

  @Get('public/pages')
  @ApiOperation({ summary: 'Get published CMS pages' })
  async getPublishedPages(@Query('type') type?: ContentType) {
    return this.cmsService.getPublishedPages(type);
  }

  @Get('public/pages/:slug')
  @ApiOperation({ summary: 'Get a published page by slug' })
  async getPageBySlug(@Param('slug') slug: string) {
    return this.cmsService.getPageBySlug(slug);
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
    // Branding section is restricted to SUPER_ADMIN and ADMIN
    if (key === 'branding' && !['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role)) {
      throw new ForbiddenException('Only admins can modify branding settings');
    }
    await this.cmsService.upsertSection(key, dto.content);
    return { success: true };
  }

  // ============ CMS Pages Admin Endpoints ============

  @Get('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all CMS pages (admin)' })
  async getAllPages(
    @Query('type') type?: ContentType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cmsService.getAllPages({
      type,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a CMS page' })
  async createPage(@Body() dto: CreatePageDto, @Req() req: any) {
    return this.cmsService.createPage(dto, req.user.id);
  }

  @Put('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a CMS page' })
  async updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.cmsService.updatePage(id, dto);
  }

  @Delete('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a CMS page' })
  async deletePage(@Param('id') id: string) {
    return this.cmsService.deletePage(id);
  }

  @Patch('pages/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publish a CMS page' })
  async publishPage(@Param('id') id: string) {
    return this.cmsService.publishPage(id);
  }

  @Patch('pages/:id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unpublish a CMS page' })
  async unpublishPage(@Param('id') id: string) {
    return this.cmsService.unpublishPage(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';
import { GalleryQueryDto } from './dto/gallery-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // ============ Public ============

  @Get('public')
  @ApiOperation({ summary: 'Get published gallery items' })
  @ApiResponse({ status: 200, description: 'Published gallery items' })
  async getPublicGallery(@Query() query: GalleryQueryDto) {
    return this.galleryService.findPublished(query.type);
  }

  // ============ Admin ============

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all gallery items (admin)' })
  async findAll(@Query() query: GalleryQueryDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 50;
    return this.galleryService.findAll({ type: query.type, page, limit });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create gallery item' })
  @ApiResponse({ status: 201, description: 'Gallery item created' })
  async create(@Body() dto: CreateGalleryItemDto) {
    return this.galleryService.create(dto);
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reorder gallery items' })
  async reorder(@Body() items: { id: string; order: number }[]) {
    return this.galleryService.reorder(items);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update gallery item' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryItemDto,
  ) {
    return this.galleryService.update(id, dto);
  }

  @Patch(':id/toggle-publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle gallery item publish status' })
  async togglePublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.togglePublish(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete gallery item' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.remove(id);
  }
}

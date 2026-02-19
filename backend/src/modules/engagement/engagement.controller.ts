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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReactionType } from '@prisma/client';

@ApiTags('Engagement')
@Controller('engagement')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  // ============ Public Feed (any authenticated user) ============

  @Get('feed')
  @ApiOperation({ summary: 'Get engagement feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.engagementService.getFeed(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      type,
    });
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending posts' })
  async getTrending() {
    return this.engagementService.getTrending();
  }

  @Get('events')
  @ApiOperation({ summary: 'Get upcoming events' })
  async getUpcomingEvents() {
    return this.engagementService.getUpcomingEvents();
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved posts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSavedPosts(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.engagementService.getSavedPosts(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('feed/:id')
  @ApiOperation({ summary: 'Get single post' })
  async getPost(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.engagementService.getPost(id, userId);
  }

  // ============ User Interactions ============

  @Post('feed/:id/react')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'React to a post' })
  async reactToPost(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body('type') type: ReactionType,
  ) {
    return this.engagementService.reactToPost(postId, userId, type);
  }

  @Post('feed/:id/comment')
  @ApiOperation({ summary: 'Comment on a post' })
  async addComment(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
    @Body('parentId') parentId?: string,
  ) {
    return this.engagementService.addComment(postId, userId, content, parentId);
  }

  @Delete('feed/:id/comment/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.engagementService.deleteComment(commentId, userId);
  }

  @Post('feed/:id/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle save post' })
  async toggleSave(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.engagementService.toggleSave(postId, userId);
  }

  @Post('feed/:id/cta-click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track CTA click' })
  async trackCtaClick(@Param('id') postId: string) {
    return this.engagementService.trackCtaClick(postId);
  }

  @Post('feed/:id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track internal share' })
  async trackShare(@Param('id') postId: string) {
    return this.engagementService.trackShare(postId);
  }

  // ============ AI-Ready Endpoints (stubs — no AI logic yet) ============

  @Get('insights')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'AI-ready: Get aggregated feed insights' })
  async getFeedInsights() {
    return this.engagementService.getFeedInsights();
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'AI-ready: Get personalized post recommendations' })
  async getRecommendations(@CurrentUser('id') userId: string) {
    return this.engagementService.getRecommendations(userId);
  }

  // ============ Admin Endpoints ============

  @Get('posts')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all posts (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  async getAdminPosts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.engagementService.getAdminPosts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      type,
    });
  }

  @Post('posts')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create engagement post' })
  async createPost(
    @Body() dto: CreatePostDto,
    @CurrentUser('id') authorId: string,
  ) {
    return this.engagementService.createPost(dto, authorId);
  }

  @Put('posts/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update engagement post' })
  async updatePost(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.engagementService.updatePost(id, dto);
  }

  @Delete('posts/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete (archive) engagement post' })
  async deletePost(@Param('id') id: string) {
    return this.engagementService.deletePost(id);
  }

  @Post('posts/:id/publish')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish engagement post' })
  async publishPost(@Param('id') id: string) {
    return this.engagementService.publishPost(id);
  }

  @Get('analytics')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get feed analytics' })
  async getFeedAnalytics() {
    return this.engagementService.getFeedAnalytics();
  }

  @Get('analytics/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get post analytics' })
  async getPostAnalytics(@Param('id') id: string) {
    return this.engagementService.getPostAnalytics(id);
  }
}

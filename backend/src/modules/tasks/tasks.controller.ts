import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, AddCommentDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaskStatus, TaskPriority } from '@prisma/client';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Create a new task' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(userId, dto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'creatorId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('assigneeId') assigneeId?: string,
    @Query('creatorId') creatorId?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('search') search?: string,
  ) {
    return this.tasksService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      assigneeId,
      creatorId,
      status,
      priority,
      search,
    });
  }

  @Get('my')
  @Roles('STAFF')
  @ApiOperation({ summary: 'Get my assigned tasks' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  getMyTasks(@CurrentUser('id') userId: string, @Query('status') status?: TaskStatus) {
    return this.tasksService.getMyTasks(userId, { status });
  }

  @Get('created')
  @Roles('STAFF')
  @ApiOperation({ summary: 'Get tasks I created' })
  getTasksCreatedByMe(@CurrentUser('id') userId: string) {
    return this.tasksService.getTasksCreatedByMe(userId);
  }

  @Get('stats')
  @Roles('STAFF')
  @ApiOperation({ summary: 'Get my task statistics' })
  getTaskStats(@CurrentUser('id') userId: string) {
    return this.tasksService.getTaskStats(userId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get task by ID' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findById(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Update task' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser('role') userRole: string,
  ) {
    return this.tasksService.update(id, dto, userRole);
  }

  @Put(':id/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Update task status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TaskStatus,
    @CurrentUser('role') userRole: string,
  ) {
    return this.tasksService.updateStatus(id, status, userRole);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete task' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.delete(id);
  }

  @Get(':id/comments')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get task comments' })
  getComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.getComments(id);
  }

  @Post(':id/comments')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Add comment to task' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.tasksService.addComment(id, userId, dto);
  }
}

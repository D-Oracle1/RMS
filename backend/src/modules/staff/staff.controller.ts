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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPosition } from '@prisma/client';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a new staff member' })
  @ApiResponse({ status: 201, description: 'Staff member created successfully' })
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all staff members' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'position', required: false, enum: StaffPosition })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('position') position?: StaffPosition,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.staffService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      departmentId,
      position,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('dashboard')
  @Roles('STAFF')
  @ApiOperation({ summary: 'Get staff dashboard data' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.staffService.getDashboard(userId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get staff member by ID' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.findById(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update staff member' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Deactivate staff member' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.deactivate(id);
  }

  @Get(':id/direct-reports')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get direct reports of a staff member' })
  getDirectReports(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.getDirectReports(id);
  }

  @Get(':id/team')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get full team hierarchy of a staff member' })
  getTeamHierarchy(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.getTeamHierarchy(id);
  }

  @Put(':id/manager')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Assign manager to staff member' })
  assignManager(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('managerId') managerId: string | null,
  ) {
    return this.staffService.assignManager(id, managerId);
  }

  // Permission endpoints
  @Get(':id/permissions')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get staff member permissions' })
  getPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.getPermissions(id);
  }

  @Post(':id/permissions')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Assign permission to staff member' })
  assignPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
  ) {
    return this.staffService.assignPermission(id, assignPermissionDto);
  }

  @Delete(':id/permissions/:permissionId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Remove permission from staff member' })
  removePermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    return this.staffService.removePermission(id, permissionId);
  }
}

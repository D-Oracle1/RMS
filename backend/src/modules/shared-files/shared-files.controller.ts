import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { SharedFilesService } from './shared-files.service';
import { SharedFilesQueryDto } from './dto/shared-files.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('Shared Files')
@Controller('shared-files')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SharedFilesController {
  constructor(private readonly sharedFilesService: SharedFilesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'List files accessible to current user' })
  @ApiResponse({ status: 200, description: 'Paginated list of files' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: SharedFilesQueryDto,
  ) {
    return this.sharedFilesService.findAll(userId, {
      search: query.search,
      category: query.category,
      departmentId: query.departmentId,
      channelId: query.channelId,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  @Get('summary')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get file count summary' })
  getSummary(@CurrentUser('id') userId: string) {
    return this.sharedFilesService.getFileSummary(userId);
  }

  @Post('upload')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
    }),
  )
  @ApiOperation({ summary: 'Upload shared file(s)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded' })
  uploadFiles(
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: MulterFile[],
    @Body() body: { departmentId?: string; channelId?: string; isPublic?: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.sharedFilesService.uploadFiles(userId, files, {
      departmentId: body.departmentId || undefined,
      channelId: body.channelId || undefined,
      isPublic: body.isPublic === 'true',
    });
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Delete a shared file' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.sharedFilesService.deleteFile(id, userId, userRole);
  }
}

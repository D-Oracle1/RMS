import { Module } from '@nestjs/common';
import { SharedFilesService } from './shared-files.service';
import { SharedFilesController } from './shared-files.controller';

@Module({
  controllers: [SharedFilesController],
  providers: [SharedFilesService],
  exports: [SharedFilesService],
})
export class SharedFilesModule {}

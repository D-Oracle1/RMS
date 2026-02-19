import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SetupController } from './setup.controller';

@Module({
  controllers: [AdminController, SetupController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

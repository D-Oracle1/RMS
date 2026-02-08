import { Module, forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { NotificationModule } from '../notification/notification.module';
import { HrModule } from '../hr/hr.module';

@Module({
  imports: [
    forwardRef(() => NotificationModule),
    forwardRef(() => HrModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

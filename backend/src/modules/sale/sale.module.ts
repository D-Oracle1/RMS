import { Module, forwardRef } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { CommissionModule } from '../commission/commission.module';
import { TaxModule } from '../tax/tax.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationModule } from '../notification/notification.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    forwardRef(() => CommissionModule),
    forwardRef(() => TaxModule),
    forwardRef(() => LoyaltyModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => ClientModule),
  ],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}

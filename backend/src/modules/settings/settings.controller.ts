import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('commission-rates')
  @ApiOperation({ summary: 'Get commission rates by tier' })
  @ApiResponse({ status: 200, description: 'Commission rates object' })
  async getCommissionRates() {
    return this.settingsService.getCommissionRates();
  }

  @Put('commission-rates')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update commission rates by tier' })
  @ApiResponse({ status: 200, description: 'Updated commission rates' })
  async updateCommissionRates(
    @Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true }))
    rates: Record<string, number>,
  ) {
    return this.settingsService.updateCommissionRates(rates);
  }

  @Get('tax-rates')
  @ApiOperation({ summary: 'Get tax rates' })
  @ApiResponse({ status: 200, description: 'Tax rates object' })
  async getTaxRates() {
    return this.settingsService.getTaxRates();
  }

  @Put('tax-rates')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update tax rates' })
  @ApiResponse({ status: 200, description: 'Updated tax rates' })
  async updateTaxRates(
    @Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true }))
    rates: Record<string, number>,
  ) {
    return this.settingsService.updateTaxRates(rates);
  }
}

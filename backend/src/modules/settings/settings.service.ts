import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const DEFAULT_COMMISSION_RATES = {
  BRONZE: 0.03,
  SILVER: 0.035,
  GOLD: 0.04,
  PLATINUM: 0.05,
};

const DEFAULT_TAX_RATES = {
  incomeTax: 0.15,
  withholdingTax: 0.10,
  vat: 0.075,
  stampDuty: 0.005,
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(key: string): Promise<any> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value ?? null;
  }

  async upsertSetting(key: string, value: any): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getCommissionRates(): Promise<Record<string, number>> {
    const rates: Record<string, number> = { ...DEFAULT_COMMISSION_RATES };

    for (const tier of Object.keys(DEFAULT_COMMISSION_RATES)) {
      const val = await this.getSetting(`commission_${tier.toLowerCase()}`);
      if (val !== null) {
        rates[tier] = typeof val === 'number' ? val : Number(val);
      }
    }

    return rates;
  }

  async updateCommissionRates(rates: Record<string, number>): Promise<Record<string, number>> {
    for (const [tier, rate] of Object.entries(rates)) {
      const key = `commission_${tier.toLowerCase()}`;
      await this.upsertSetting(key, rate);
    }
    return this.getCommissionRates();
  }

  async getTaxRates(): Promise<Record<string, number>> {
    const defaults = { ...DEFAULT_TAX_RATES };

    for (const key of Object.keys(defaults)) {
      const val = await this.getSetting(`tax_${key}`);
      if (val !== null) {
        defaults[key as keyof typeof defaults] = typeof val === 'number' ? val : Number(val);
      }
    }

    return defaults;
  }

  async updateTaxRates(rates: Record<string, number>): Promise<Record<string, number>> {
    for (const [key, rate] of Object.entries(rates)) {
      await this.upsertSetting(`tax_${key}`, rate);
    }
    return this.getTaxRates();
  }

  // Legacy key support: the seed uses 'tax_rate' for the main income tax
  async getMainTaxRate(): Promise<number> {
    const val = await this.getSetting('tax_incomeTax');
    if (val !== null) return typeof val === 'number' ? val : Number(val);

    const legacy = await this.getSetting('tax_rate');
    if (legacy !== null) return typeof legacy === 'number' ? legacy : Number(legacy);

    return DEFAULT_TAX_RATES.incomeTax;
  }
}

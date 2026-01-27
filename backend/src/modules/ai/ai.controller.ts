import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyType } from '@prisma/client';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('predict-price')
  @ApiOperation({ summary: 'Predict property price using AI' })
  @ApiResponse({ status: 200, description: 'Price prediction' })
  async predictPrice(
    @Body() data: {
      type: PropertyType;
      city: string;
      area: number;
      bedrooms?: number;
      bathrooms?: number;
      yearBuilt?: number;
      features?: string[];
    },
  ) {
    return this.aiService.predictPropertyPrice(data);
  }

  @Get('market-analysis')
  @ApiOperation({ summary: 'Get AI market analysis for a city' })
  @ApiQuery({ name: 'city', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Market analysis' })
  async getMarketAnalysis(@Query('city') city: string) {
    return this.aiService.getMarketAnalysis(city);
  }

  @Get('realtor-performance/:realtorId')
  @ApiOperation({ summary: 'Predict realtor performance' })
  @ApiResponse({ status: 200, description: 'Performance prediction' })
  async predictRealtorPerformance(@Param('realtorId') realtorId: string) {
    return this.aiService.predictRealtorPerformance(realtorId);
  }

  @Get('investment-score/:propertyId')
  @ApiOperation({ summary: 'Get property investment score' })
  @ApiResponse({ status: 200, description: 'Investment score' })
  async getInvestmentScore(@Param('propertyId') propertyId: string) {
    return this.aiService.getInvestmentScore(propertyId);
  }
}

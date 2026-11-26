import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';
import { phoneModelRepository } from '../repositories/phone-model.repository';
import {
  phoneValuationResultSchema,
  type PhoneValuationInput,
  type PhoneValuationResult,
} from '../schemas/valuation.schema';

export class ValuationService {
  /**
   * Calculate phone valuation based on market data
   */
  async calculateValuation(
    input: PhoneValuationInput,
    isPreview: boolean = false
  ): Promise<PhoneValuationResult> {
    const model = await phoneModelRepository.findById(input.modelId);
    if (!model) {
      throw new Error('Phone model not found');
    }

    // Query similar listings from the marketplace
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
    };

    // Filter by condition if provided
    if (input.condition) {
      where.condition = input.condition;
    }

    // Filter by storage if provided
    if (input.storage) {
      where.attributes = {
        path: ['storage'],
        string_contains: input.storage,
      };
    }

    // Filter by RAM if provided
    if (input.ram) {
      where.attributes = {
        path: ['ram'],
        string_contains: input.ram,
      };
    }

    // Get recent listings for this model (filter by title containing model name)
    const listings = await prisma.listing.findMany({
      where: {
        ...where,
        OR: [
          { title: { contains: model.name, mode: 'insensitive' } },
          { title: { contains: model.modelNumber || '', mode: 'insensitive' } },
        ],
      },
      select: {
        price: true,
        condition: true,
        city: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate valuation
    const prices = listings.map(l => Number(l.price));

    let minPrice = 0;
    let maxPrice = 0;
    let avgPrice = 0;

    if (prices.length > 0) {
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
      avgPrice = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;
    } else {
      // Fallback to launch price if no listings available
      if (model.launchPrice) {
        const launchPrice = Number(model.launchPrice);
        // Used market is typically 60-80% of launch price
        minPrice = launchPrice * 0.5;
        maxPrice = launchPrice * 0.8;
        avgPrice = launchPrice * 0.65;
      }
    }

    // Adjust for battery health if provided
    if (input.batteryHealth !== undefined) {
      const batteryFactor = input.batteryHealth / 100;
      avgPrice = avgPrice * (0.7 + (batteryFactor * 0.3));
      minPrice = minPrice * (0.7 + (batteryFactor * 0.3));
      maxPrice = maxPrice * (0.7 + (batteryFactor * 0.3));
    }

    // Adjust for condition
    const conditionMultipliers: Record<string, number> = {
      NEW: 1.2,
      OPEN_BOX: 1.1,
      USED: 1.0,
      REFURBISHED: 0.85,
      FOR_PARTS: 0.4,
    };

    if (input.condition && conditionMultipliers[input.condition] !== undefined) {
      const multiplier = conditionMultipliers[input.condition]!;
      avgPrice = avgPrice * multiplier;
      minPrice = minPrice * multiplier;
      maxPrice = maxPrice * multiplier;
    }

    // Round to nearest 100
    minPrice = Math.round(minPrice / 100) * 100;
    maxPrice = Math.round(maxPrice / 100) * 100;
    avgPrice = Math.round(avgPrice / 100) * 100;

    // Ensure minimum prices
    minPrice = Math.max(minPrice, 1000);
    maxPrice = Math.max(maxPrice, minPrice + 500);
    avgPrice = Math.max(avgPrice, minPrice);

    // Save valuation record
    const valuation = await prisma.phoneValuation.create({
      data: {
        modelId: input.modelId,
        storage: input.storage,
        ram: input.ram,
        condition: input.condition,
        batteryHealth: input.batteryHealth,
        estimatedPriceMin: minPrice,
        estimatedPriceMax: maxPrice,
        estimatedPriceAvg: avgPrice,
        marketData: listings as unknown as Prisma.InputJsonValue,
        sampleCount: listings.length,
        isPreview,
      },
    });

    return {
      id: valuation.id,
      modelId: valuation.modelId,
      modelName: model.name,
      brandName: model.brand.name,
      storage: input.storage || null,
      ram: input.ram || null,
      condition: input.condition || null,
      batteryHealth: input.batteryHealth || null,
      estimatedPriceMin: minPrice,
      estimatedPriceMax: maxPrice,
      estimatedPriceAvg: avgPrice,
      currency: 'PKR',
      sampleCount: listings.length,
      marketData: listings.map(l => ({
        price: Number(l.price),
        condition: l.condition,
        city: l.city,
        createdAt: l.createdAt,
      })),
      isPreview,
      calculatedAt: valuation.createdAt,
    };
  }

  /**
   * Get valuation by ID
   */
  async getValuation(id: string) {
    const valuation = await prisma.phoneValuation.findUnique({
      where: { id },
      include: { model: { include: { brand: true } } },
    });

    if (!valuation) {
      return null;
    }

    return {
      id: valuation.id,
      modelId: valuation.modelId,
      modelName: valuation.model.name,
      brandName: valuation.model.brand.name,
      storage: valuation.storage,
      ram: valuation.ram,
      condition: valuation.condition,
      batteryHealth: valuation.batteryHealth,
      estimatedPriceMin: Number(valuation.estimatedPriceMin),
      estimatedPriceMax: Number(valuation.estimatedPriceMax),
      estimatedPriceAvg: Number(valuation.estimatedPriceAvg),
      currency: 'PKR',
      sampleCount: valuation.sampleCount,
      marketData: phoneValuationResultSchema.shape.marketData.parse(
        valuation.marketData ?? undefined,
      ),
      isPreview: valuation.isPreview,
      calculatedAt: valuation.createdAt,
    };
  }

  /**
   * Get market price trend for a model
   */
  async getMarketTrend(_modelId: string) {
    const listings = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      select: {
        price: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 2000,
    });

    // Group by week
    const weeklyData: Record<string, { prices: number[]; count: number }> = {};

    listings.forEach(listing => {
      const weekKey = new Date(listing.createdAt).toISOString().split('T')[0] ?? '';
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { prices: [], count: 0 };
      }
      const entry = weeklyData[weekKey];
      if (entry) {
        entry.prices.push(Number(listing.price));
        entry.count++;
      }
    });

    return Object.entries(weeklyData).map(([date, data]) => ({
      date,
      avgPrice: data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length,
      count: data.count,
    }));
  }
}

export const valuationService = new ValuationService();

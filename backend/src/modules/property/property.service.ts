import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyStatus, PropertyType, DocumentType } from '@prisma/client';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPropertyDto: CreatePropertyDto, userId: string) {
    return this.prisma.property.create({
      data: {
        ...createPropertyDto,
        originalPrice: createPropertyDto.price,
        realtorId: createPropertyDto.realtorId,
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    type?: PropertyType;
    status?: PropertyStatus;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
    maxBedrooms?: number;
    isListed?: boolean;
    realtorId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      status,
      city,
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      isListed,
      realtorId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (minPrice !== undefined) where.price = { ...where.price, gte: minPrice };
    if (maxPrice !== undefined) where.price = { ...where.price, lte: maxPrice };
    if (minBedrooms !== undefined) where.bedrooms = { ...where.bedrooms, gte: minBedrooms };
    if (maxBedrooms !== undefined) where.bedrooms = { ...where.bedrooms, lte: maxBedrooms };
    if (isListed !== undefined) where.isListed = isListed;
    if (realtorId) where.realtorId = realtorId;

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          realtor: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
          _count: {
            select: { offers: true, documents: true },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: properties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        realtor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
        documents: true,
        priceHistory: {
          orderBy: { createdAt: 'desc' },
        },
        offers: {
          orderBy: { createdAt: 'desc' },
          include: {
            buyer: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        sales: {
          orderBy: { saleDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Track price changes
    if (updatePropertyDto.price && updatePropertyDto.price !== Number(property.price)) {
      await this.prisma.priceHistory.create({
        data: {
          propertyId: id,
          oldPrice: property.price,
          newPrice: updatePropertyDto.price,
          changedBy: userId,
          reason: updatePropertyDto.priceChangeReason,
        },
      });

      // Update appreciation percentage
      updatePropertyDto.appreciationPercentage =
        ((updatePropertyDto.price - Number(property.originalPrice)) /
          Number(property.originalPrice)) *
        100;
    }

    const { priceChangeReason, ...updateData } = updatePropertyDto;

    return this.prisma.property.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.property.delete({
      where: { id },
    });

    return { message: 'Property deleted successfully' };
  }

  async getListedProperties(query: {
    page?: number;
    limit?: number;
    type?: PropertyType;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    return this.findAll({
      ...query,
      isListed: true,
      status: PropertyStatus.LISTED,
    });
  }

  async submitOffer(
    propertyId: string,
    buyerId: string,
    data: {
      amount: number;
      message?: string;
      expiresInDays?: number;
    },
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (!property.isListed) {
      throw new BadRequestException('Property is not listed for sale');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

    return this.prisma.offer.create({
      data: {
        propertyId,
        buyerId,
        amount: data.amount,
        message: data.message,
        expiresAt,
      },
    });
  }

  async addDocument(
    propertyId: string,
    data: {
      type: DocumentType;
      name: string;
      url: string;
      size: number;
      mimeType: string;
      uploadedBy: string;
    },
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.document.create({
      data: {
        propertyId,
        ...data,
      },
    });
  }

  async getStats() {
    const [
      total,
      listed,
      sold,
      byType,
      avgPrice,
      totalValue,
    ] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.property.count({ where: { isListed: true } }),
      this.prisma.property.count({ where: { status: PropertyStatus.SOLD } }),
      this.prisma.property.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
      this.prisma.property.aggregate({
        _avg: { price: true },
      }),
      this.prisma.property.aggregate({
        _sum: { price: true },
      }),
    ]);

    return {
      total,
      listed,
      sold,
      available: total - sold,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      avgPrice: avgPrice._avg.price || 0,
      totalValue: totalValue._sum.price || 0,
    };
  }
}

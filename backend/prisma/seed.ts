import { PrismaClient, UserRole, UserStatus, LoyaltyTier, PropertyType, PropertyStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.loyaltyPoints.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.tax.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.property.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.realtorProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@rms.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1234567890',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      adminProfile: {
        create: {
          permissions: ['all'],
          department: 'Executive',
        },
      },
    },
  });

  console.log('👑 Created Super Admin:', superAdmin.email);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@rms.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Admin',
      phone: '+1234567891',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      adminProfile: {
        create: {
          permissions: ['manage_realtors', 'manage_clients', 'manage_properties', 'view_analytics'],
          department: 'Operations',
        },
      },
    },
  });

  console.log('👤 Created Admin:', admin.email);

  // Create Realtors
  const realtorData = [
    { firstName: 'Sarah', lastName: 'Johnson', tier: LoyaltyTier.PLATINUM, points: 55000, sales: 45 },
    { firstName: 'Michael', lastName: 'Chen', tier: LoyaltyTier.GOLD, points: 22000, sales: 38 },
    { firstName: 'Emily', lastName: 'Davis', tier: LoyaltyTier.GOLD, points: 18000, sales: 32 },
    { firstName: 'James', lastName: 'Wilson', tier: LoyaltyTier.SILVER, points: 8500, sales: 28 },
    { firstName: 'Lisa', lastName: 'Brown', tier: LoyaltyTier.SILVER, points: 7000, sales: 25 },
    { firstName: 'David', lastName: 'Martinez', tier: LoyaltyTier.BRONZE, points: 3500, sales: 15 },
  ];

  const realtors = [];

  for (let i = 0; i < realtorData.length; i++) {
    const data = realtorData[i];
    const realtor = await prisma.user.create({
      data: {
        email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@rms.com`,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: `+123456789${i + 2}`,
        role: UserRole.REALTOR,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        realtorProfile: {
          create: {
            licenseNumber: `LIC-${String(100000 + i).padStart(6, '0')}`,
            agency: 'RMS Realty Group',
            bio: `Experienced realtor specializing in ${['residential', 'commercial', 'luxury'][i % 3]} properties.`,
            specializations: [['Residential', 'Luxury'], ['Commercial', 'Investment'], ['Condo', 'Townhouse']][i % 3],
            totalSales: data.sales,
            totalSalesValue: data.sales * 500000,
            totalCommission: data.sales * 15000,
            totalTaxPaid: data.sales * 2250,
            loyaltyTier: data.tier,
            loyaltyPoints: data.points,
            currentRank: i + 1,
            isRealtorOfMonth: i === 0,
            isRealtorOfYear: i === 0,
            achievements: i === 0 ? ['first_sale', 'ten_sales', 'fifty_sales', 'million_dollar'] : ['first_sale', 'ten_sales'],
          },
        },
      },
      include: {
        realtorProfile: true,
      },
    });
    realtors.push(realtor);
  }

  console.log(`🏠 Created ${realtors.length} Realtors`);

  // Create Clients
  const clientData = [
    { firstName: 'John', lastName: 'Doe' },
    { firstName: 'Jane', lastName: 'Smith' },
    { firstName: 'Robert', lastName: 'Johnson' },
    { firstName: 'Maria', lastName: 'Garcia' },
    { firstName: 'William', lastName: 'Brown' },
  ];

  const clients = [];

  for (let i = 0; i < clientData.length; i++) {
    const data = clientData[i];
    const client = await prisma.user.create({
      data: {
        email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@email.com`,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: `+198765432${i}`,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        clientProfile: {
          create: {
            realtorId: realtors[i % realtors.length].realtorProfile!.id,
            address: `${100 + i} Main Street`,
            city: ['Los Angeles', 'New York', 'Miami', 'Chicago', 'Seattle'][i],
            state: ['CA', 'NY', 'FL', 'IL', 'WA'][i],
            zipCode: `${90000 + i * 1000}`,
            country: 'USA',
          },
        },
      },
      include: {
        clientProfile: true,
      },
    });
    clients.push(client);
  }

  console.log(`👥 Created ${clients.length} Clients`);

  // Create Properties
  const propertyData = [
    { title: 'Modern Downtown Condo', type: PropertyType.CONDO, price: 650000, city: 'Los Angeles' },
    { title: 'Beachfront Villa', type: PropertyType.VILLA, price: 2500000, city: 'Malibu' },
    { title: 'Family Suburban Home', type: PropertyType.RESIDENTIAL, price: 485000, city: 'Pasadena' },
    { title: 'Luxury Penthouse', type: PropertyType.APARTMENT, price: 1850000, city: 'Beverly Hills' },
    { title: 'Commercial Office Space', type: PropertyType.COMMERCIAL, price: 1200000, city: 'Downtown LA' },
    { title: 'Mountain Retreat Cabin', type: PropertyType.RESIDENTIAL, price: 380000, city: 'Big Bear' },
    { title: 'Urban Loft', type: PropertyType.APARTMENT, price: 550000, city: 'Arts District' },
    { title: 'Starter Home', type: PropertyType.RESIDENTIAL, price: 320000, city: 'Long Beach' },
  ];

  const properties = [];

  for (let i = 0; i < propertyData.length; i++) {
    const data = propertyData[i];
    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: `Beautiful ${data.type.toLowerCase()} property in ${data.city}. Features modern amenities and stunning views.`,
        type: data.type,
        status: i < 6 ? PropertyStatus.AVAILABLE : PropertyStatus.SOLD,
        address: `${200 + i} ${['Oak', 'Pine', 'Maple', 'Cedar', 'Elm'][i % 5]} Street`,
        city: data.city,
        state: 'CA',
        zipCode: `${90000 + i * 100}`,
        country: 'USA',
        price: data.price,
        originalPrice: data.price * 0.9,
        appreciationPercentage: 10,
        bedrooms: [2, 4, 3, 3, 0, 2, 1, 3][i],
        bathrooms: [2, 3.5, 2, 2.5, 2, 1, 1, 2][i],
        area: [1200, 3500, 1800, 2200, 5000, 1400, 900, 1500][i],
        yearBuilt: 2015 + (i % 8),
        features: ['Pool', 'Garage', 'Garden', 'Smart Home'].slice(0, (i % 4) + 1),
        isListed: i < 4,
        listingPrice: i < 4 ? data.price * 1.05 : null,
        realtorId: realtors[i % realtors.length].realtorProfile!.id,
        ownerId: i >= 6 ? clients[i % clients.length].clientProfile!.id : null,
      },
    });
    properties.push(property);
  }

  console.log(`🏡 Created ${properties.length} Properties`);

  // Create some sample sales
  for (let i = 0; i < 3; i++) {
    const realtor = realtors[i].realtorProfile!;
    const client = clients[i].clientProfile!;
    const property = properties[properties.length - 2 + i] || properties[0];

    const salePrice = Number(property.price);
    const commissionRate = 0.04;
    const commissionAmount = salePrice * commissionRate;
    const taxRate = 0.15;
    const taxAmount = commissionAmount * taxRate;

    await prisma.sale.create({
      data: {
        propertyId: property.id,
        realtorId: realtor.id,
        clientId: client.id,
        salePrice,
        saleDate: new Date(2024, 0, 15 - i * 5),
        status: 'COMPLETED',
        commissionRate,
        commissionAmount,
        taxRate,
        taxAmount,
        netAmount: commissionAmount - taxAmount,
        loyaltyPointsAwarded: 150,
        commission: {
          create: {
            realtorId: realtor.id,
            amount: commissionAmount,
            rate: commissionRate,
            status: 'PAID',
            paidAt: new Date(),
          },
        },
        tax: {
          create: {
            realtorId: realtor.id,
            amount: taxAmount,
            rate: taxRate,
            year: 2024,
            quarter: 1,
          },
        },
      },
    });
  }

  console.log('💰 Created sample Sales');

  // Create system settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'commission_bronze', value: { rate: 0.03 } },
      { key: 'commission_silver', value: { rate: 0.035 } },
      { key: 'commission_gold', value: { rate: 0.04 } },
      { key: 'commission_platinum', value: { rate: 0.05 } },
      { key: 'tax_rate', value: { rate: 0.15 } },
      { key: 'loyalty_points_per_sale', value: { points: 100 } },
    ],
  });

  console.log('⚙️ Created System Settings');

  console.log('');
  console.log('✅ Database seeding completed!');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('   Super Admin: superadmin@rms.com');
  console.log('   Admin:       admin@rms.com');
  console.log('   Realtor:     sarah.johnson@rms.com');
  console.log('   Client:      john.doe@email.com');
  console.log('   Password:    Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

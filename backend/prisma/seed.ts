import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@rms.com' },
    update: {},
    create: {
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

  console.log('Super Admin created:', superAdmin.email);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rms.com' },
    update: {},
    create: {
      email: 'admin@rms.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
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

  console.log('Admin created:', admin.email);

  // Create system settings (commission rates and tax)
  const settings = [
    { key: 'commission_bronze', value: { rate: 0.03 } },
    { key: 'commission_silver', value: { rate: 0.035 } },
    { key: 'commission_gold', value: { rate: 0.04 } },
    { key: 'commission_platinum', value: { rate: 0.05 } },
    { key: 'tax_rate', value: { rate: 0.15 } },
    { key: 'loyalty_points_per_sale', value: { points: 100 } },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('System settings created');

  console.log('');
  console.log('Database seeded successfully!');
  console.log('');
  console.log('Accounts:');
  console.log('  Super Admin: superadmin@rms.com / Admin123!');
  console.log('  Admin:       admin@rms.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '../src/generated/master-client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasourceUrl: process.env.MASTER_DATABASE_URL,
});

async function main() {
  console.log('Seeding master database...');

  const password = await bcrypt.hash('SuperAdmin123!', 12);

  const admin = await prisma.superAdmin.upsert({
    where: { email: 'superadmin@rms.com' },
    update: {},
    create: {
      email: 'superadmin@rms.com',
      password,
      firstName: 'Platform',
      lastName: 'Admin',
      phone: '+2348000000000',
    },
  });

  console.log('Super Admin created:');
  console.log(`  Email:    superadmin@rms.com`);
  console.log(`  Password: SuperAdmin123!`);
  console.log(`  ID:       ${admin.id}`);
  console.log('');
  console.log('Master database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

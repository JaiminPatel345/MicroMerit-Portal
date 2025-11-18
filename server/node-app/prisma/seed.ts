import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash the default admin password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create or update default admin
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@micromerit.com' },
    update: {},
    create: {
      email: 'admin@micromerit.com',
      password_hash: hashedPassword,
    },
  });

  console.log('✅ Default admin created/verified:');
  console.log('   Email:', admin.email);
  console.log('   Password: admin123');
  console.log('   ID:', admin.id);
  console.log('');
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

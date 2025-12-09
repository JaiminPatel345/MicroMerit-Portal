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

  // Create external issuers for credential sync
  console.log('Creating external issuers for credential sync...');
  
  const externalIssuers = [
    { id: 4, name: 'NSDC', email: 'nsdc@example.com', type: 'external' },
    { id: 5, name: 'NSQF', email: 'nsqf@example.com', type: 'external' },
    { id: 6, name: 'Udemy', email: 'udemy@example.com', type: 'external' },
    { id: 7, name: 'Jaimin Pvt Ltd', email: 'jaimin@example.com', type: 'external' },
    { id: 8, name: 'Smart India Hackathon', email: 'sih@example.com', type: 'external' },
  ];

  for (const issuerData of externalIssuers) {
    await prisma.issuer.upsert({
      where: { id: issuerData.id },
      update: {},
      create: {
        id: issuerData.id,
        name: issuerData.name,
        email: issuerData.email,
        password_hash: await bcrypt.hash('external123', 10),
        type: issuerData.type as any,
        status: 'approved',
        is_blocked: false,
      },
    });
    console.log(`✅ External issuer created: ${issuerData.name} (ID: ${issuerData.id})`);
  }
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

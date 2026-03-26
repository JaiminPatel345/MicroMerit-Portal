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
  
  // On-demand external issuers — shown in the "Add Certificate" modal dropdown.
  // IDs must match the env vars: GOOGLE_DUMMY_ISSUER_ID, UDEMY_DUMMY_ISSUER_ID,
  // JAIMIN_DUMMY_ISSUER_ID, CREDLY_ISSUER_ID in server/node-app/.env
  const externalIssuers = [
    { id: 6, name: 'Udemy',         email: 'udemy@example.com',   type: 'external' },  // UDEMY_DUMMY_ISSUER_ID=6
    { id: 7, name: 'Jaimin Pvt Ltd',email: 'jaimin@example.com',  type: 'external' },  // JAIMIN_DUMMY_ISSUER_ID=7
    { id: 8, name: 'Credly',        email: 'credly@example.com',  type: 'external' },  // CREDLY_ISSUER_ID=8
    { id: 9, name: 'Google',        email: 'google@example.com',  type: 'external' },  // GOOGLE_DUMMY_ISSUER_ID=9
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
  
  // Create test platform issuers — visible in admin portal (type != 'external')
  console.log('Creating test platform issuers...');
  const issuerPassword = await bcrypt.hash('issuer123', 10);

  const platformIssuers = [
    {
      email: 'issuer@test.com',
      name: 'CHARUSAT University',
      type: 'university',
      status: 'approved',
      website_url: 'https://charusat.ac.in',
      official_domain: 'charusat.ac.in',
      contact_person_name: 'Dr. Rajesh Patel',
      contact_person_designation: 'Registrar',
      address: 'CHARUSAT Campus, Changa, Anand, Gujarat 388421',
    },
    {
      email: 'issuer2@test.com',
      name: 'TechSkill Academy',
      type: 'training_institute',
      status: 'approved',
      website_url: 'https://techskill.example.com',
      official_domain: 'techskill.example.com',
      contact_person_name: 'Amit Shah',
      contact_person_designation: 'Director',
      address: 'Ahmedabad, Gujarat',
    },
    {
      email: 'issuer3@test.com',
      name: 'InnovateCorp Pvt Ltd',
      type: 'corporate',
      status: 'pending',
      website_url: 'https://innovatecorp.example.com',
      official_domain: 'innovatecorp.example.com',
      contact_person_name: 'Priya Mehta',
      contact_person_designation: 'HR Manager',
      address: 'Surat, Gujarat',
    },
  ];

  for (const issuerData of platformIssuers) {
    await prisma.issuer.upsert({
      where: { email: issuerData.email },
      update: {},
      create: {
        ...issuerData,
        password_hash: issuerPassword,
        is_blocked: false,
        approved_at: issuerData.status === 'approved' ? new Date() : null,
      } as any,
    });
    console.log(`✅ Platform issuer created: ${issuerData.name} (${issuerData.status})`);
  }
  console.log('   Login: issuer@test.com / issuer123');
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

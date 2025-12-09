
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.skillKnowledgeBase.count({
      where: { source_type: 'NQR' }
  });
  console.log(`Total NQR records so far: ${count}`);

  const sample = await prisma.skillKnowledgeBase.findFirst({
      where: { source_type: 'NQR' }
  });
  console.log('Sample NQR record:', sample);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

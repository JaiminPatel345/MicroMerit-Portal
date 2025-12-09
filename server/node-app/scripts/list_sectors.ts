
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sectors = await prisma.skillKnowledgeBase.findMany({
      select: { sector: true },
      distinct: ['sector'],
      orderBy: { sector: 'asc' }
  });
  
  console.log(`Total Sectors: ${sectors.length}`);
  console.log('--------------------------------');
  sectors.forEach((s, i) => {
      if (s.sector) console.log(`${i + 1}. ${s.sector}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

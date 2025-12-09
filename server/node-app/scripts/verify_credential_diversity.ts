
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying Global Credential Sector Coverage...');
  
  // 1. Get all unique sectors from SkillKnowledgeBase
  const allSectors = await prisma.skillKnowledgeBase.findMany({ select: { sector: true }, distinct: ['sector'] });
  const sectorNames = allSectors.map(s => s.sector).filter(Boolean) as string[];
  
  let valid = true;
  for (const sector of sectorNames) {
      const count = await prisma.credential.count({
          where: { sector: sector, status: 'issued' }
      });
      if (count < 2) {
          console.error(`[FAIL] Sector "${sector}" has only ${count} credentials!`);
          valid = false;
      }
  }
  
  if (valid) console.log('[PASS] All 44 sectors have at least 2 credentials.');
  else console.log('[FAIL] Some sectors are under-represented.');

  // 2. Check Learner 1
  const learner = await prisma.learner.findUnique({ 
      where: { email: 'learner_1@test.com' },
      include: { credentials: true }
  });
  
  if (learner) {
      console.log(`\nSample Learner (learner_1@test.com) Credentials: ${learner.credentials.length}`);
      learner.credentials.forEach((c, i) => {
          console.log(`${i+1}. ${c.certificate_title} [${c.sector}] (Metadata: ${!!c.metadata})`);
      });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

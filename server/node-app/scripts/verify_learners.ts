
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.learner.count({
      where: { email: { contains: '@test.com' } }
  });
  console.log(`Total dummy learners: ${count}`);

  const sample = await prisma.learner.findFirst({
      where: { email: 'learner_1@test.com' },
      include: { skillProfile: true }
  });
  
  if (sample) {
      console.log('Sample Learner:', sample.email);
      console.log('Has Skill Profile:', !!sample.skillProfile);
      if (sample.skillProfile && sample.skillProfile.data) {
          const data: any = sample.skillProfile.data;
          console.log('Top Skills:', data.topSkills ? data.topSkills.length : 0);
          console.log('Total Skills:', data.allSkills ? data.allSkills.length : 0);
          console.log('Sectors:', data.sectors);
      }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

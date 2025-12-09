
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sample = await prisma.learner.findFirst({
      where: { email: 'learner_1@test.com' },
      include: { skillProfile: true }
  });
  
  if (sample && sample.skillProfile && sample.skillProfile.data) {
      const data: any = sample.skillProfile.data;
      console.log('Sample Learner:', sample.email);
      console.log('Total Skills:', data.allSkills ? data.allSkills.length : 0);
      console.log('Sectors Count:', data.sectors ? data.sectors.length : 0);
      console.log('Sectors List:', data.sectors);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

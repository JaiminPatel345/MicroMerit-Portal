
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
      if (data.topSkills) {
          console.log('Top Skills Sample:');
          data.topSkills.forEach((s: any, i: number) => console.log(`${i+1}. ${s.skill}`));
      }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sample = await prisma.learner.findFirst({
      where: { email: 'learner_1@test.com' },
      include: { 
          skillProfile: true,
          credentials: { take: 1 }
      }
  });
  
  if (sample) {
      const data: any = sample.skillProfile?.data;
      console.log('Sample Learner:', sample.email);
      console.log('Credentials Count:', await prisma.credential.count({ where: { learner_id: sample.id } }));
      
      if (data && data.topSkills && data.topSkills.length > 0) {
          console.log('Top Skill 0 Type:', typeof data.topSkills[0]);
          console.log('Top Skill 0 Value:', JSON.stringify(data.topSkills[0]));
      } else {
          console.log('No Top Skills found in profile data');
      }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

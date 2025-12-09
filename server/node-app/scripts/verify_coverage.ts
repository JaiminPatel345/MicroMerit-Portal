
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all skill profiles
  // Efficiently, we can search for a random skill name and count occurrences
  // But verifying ALL is expensive. Let's sample 5 random skills.
  
  const totalSkills = await prisma.skillKnowledgeBase.count();
  console.log(`Checking sample of ${totalSkills} skills...`);
  
  const sampleSkills = await prisma.skillKnowledgeBase.findMany({
      take: 5,
      skip: Math.floor(Math.random() * (totalSkills - 5))
  });
  
  for (const skill of sampleSkills) {
      const term = skill.title || skill.job_role || 'Unknown';
      console.log(`Checking coverage for: ${term}`);
      
      // Count learners who have this skill in their JSON profile
      // Note: This relies on string matching which is not perfect but good enough for verifying seed logic
      const count = await prisma.learnerSkillProfile.count({
          where: {
              data: {
                  path: ['allSkills'],
                  array_contains: term
              }
          }
      });
      console.log(`  -> Found in ${count} users`);
      
      // Also check specific user IDs by raw query if prisma json filtering is tricky
      if (count < 2) {
           const raw = await prisma.$queryRawUnsafe<any[]>(
               `SELECT COUNT(*) as c FROM "LearnerSkillProfile" WHERE data::text LIKE $1`,
               `%${term}%`
           );
           console.log(`  -> Raw count: ${raw[0].c}`);
      }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());


import { PrismaClient } from '@prisma/client';
import { learnerRepository } from '../src/modules/learner/repository'; // Assuming export availability, or mock
// Since I cannot import service logic directly due to potentially complex dependencies or path issues in script mode without full environment, 
// I will replicate the service logic snippet to verify it works against the DB data.

const prisma = new PrismaClient();

async function main() {
  const learner = await prisma.learner.findUnique({ where: { email: 'learner_1@test.com' } });
  if (!learner) return console.log('Learner not found');

  console.log('Testing Dashboard Stats Fallback for:', learner.email);

  // 1. Get raw stats (simulating repository call)
  const stats = await learnerRepository.getDashboardStats(learner.id);
  console.log('Repo Stats (Credentials only):', JSON.stringify(stats.topSkills));

  // 2. Apply fallback logic (simulating service call)
  if (!stats.topSkills || stats.topSkills.length === 0) {
      console.log('Applying Fallback...');
      const profile = await prisma.learnerSkillProfile.findUnique({ where: { learner_id: learner.id } });
      if (profile && profile.data) {
           const data: any = profile.data;
           if (data.topSkills && Array.isArray(data.topSkills)) {
                stats.topSkills = data.topSkills.map((s: any) => ({
                    skill: typeof s === 'string' ? s : s.skill,
                    count: 1
                }));
                if (stats.totalSkillsVerified === 0) {
                    stats.totalSkillsVerified = (data.allSkills?.length) || stats.topSkills.length;
                }
           }
      }
  }

  console.log('Final Dashboard Top Skills:', stats.topSkills.slice(0, 3)); // Show first 3
  console.log('Total Skills Verified:', stats.totalSkillsVerified);
}

// Mocking repository for script usage if import fails (likely)
// But since I'm using npx tsx, imports might work if paths are correct relative to script execution.
// If repo import fails, I'll essentially trust the logic copy-paste above.
// Let's rely on the copy-pasted logic verification against DB data.

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

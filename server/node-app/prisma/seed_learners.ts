
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching SkillKnowledgeBase...');
    const skills = await prisma.skillKnowledgeBase.findMany({
        select: {
            id: true,
            title: true,
            sector: true,
            job_role: true,
            keywords: true,
            nsqf_level: true
        } // Fetch all to ensure coverage
    });

    if (skills.length === 0) {
        console.log('No skills found in database. Please run seed_nqr.ts first.');
        return;
    }

    console.log(`Found ${skills.length} skills/records.`);

    // Group by sector to distribute somewhat logically
    const sectorMap: Record<string, typeof skills> = {};
    skills.forEach(s => {
        const sect = s.sector || 'Uncategorized';
        if (!sectorMap[sect]) sectorMap[sect] = [];
        sectorMap[sect].push(s);
    });

    const sectors = Object.keys(sectorMap);
    console.log(`Found ${sectors.length} unique sectors.`);

    // Target ~50 learners or enough to cover things reasonable
    // Strategy: Create 1 learner per sector initially to ensure sector coverage?
    // Or just round robin through all skills and assign them to learners.
    
    // Let's create a fixed number of learners, e.g., 50.
    const NUM_LEARNERS = 50; 
    const passwordHash = await hash('Test@123', 10);

    // Prepare learners data structure
    const learnersData = [];
    for (let i = 0; i < NUM_LEARNERS; i++) {
        learnersData.push({
            name: `Test Learner ${i + 1}`,
            email: `learner_${i + 1}@test.com`, // dummy email
            phone: `999000${(i + 1).toString().padStart(4, '0')}`, // dummy phone
            skills: [] as typeof skills,
            sectors: new Set<string>()
        });
    }

    // Distribute skills to ensure:
    // 1. Every learner has coverage of ALL sectors (if possible)
    // 2. All skills are used at least once collectively

    // Helper to get random item from array
    const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

    // Step 1: Guarantee Sector Coverage for each learner
    for (const lData of learnersData) {
        for (const bucket of Object.values(sectorMap)) {
            if (bucket.length > 0) {
                // Pick one random skill from this sector
                const skill = getRandom(bucket);
                lData.skills.push(skill);
                if (skill.sector) lData.sectors.add(skill.sector);
            }
        }
    }

    // Step 2: Ensure ALL skills are assigned at least TWICE to different learners
    // We track how many times each skill has been assigned globally.
    // If a skill is assigned < 2 times, we pick random learners to add it to.
    
    // 1. Build a map of skillId -> count from Step 1
    const skillAssignmentCount = new Map<number, number>();
    skills.forEach(s => skillAssignmentCount.set(s.id, 0));

    // Initialize counts from Step 1 assignments
    learnersData.forEach(l => {
        l.skills.forEach(s => {
            const current = skillAssignmentCount.get(s.id) || 0;
            skillAssignmentCount.set(s.id, current + 1);
        });
        // Init skillSet for fast lookup
        (l as any).skillSet = new Set(l.skills.map(s => s.id));
    });

    // 2. Iterate all skills and ensure at least 2 assignments
    // We shuffle the learners array for randomness in assignment
    const shuffledLearnerIndices = Array.from({ length: NUM_LEARNERS }, (_, i) => i);

    skills.forEach(skill => {
        let count = skillAssignmentCount.get(skill.id) || 0;
        
        while (count < 2) {
            // Find a random learner who doesn't have this skill
            // Shuffle indices every time? A bit expensive. 
            // Better: just pick random index and probe linearly or randomly.
            // Since we have 50 learners and need to find *one*, random probing is fast.
            
            let attempts = 0;
            let added = false;
            
            while (!added && attempts < 50) {
                const randIdx = Math.floor(Math.random() * NUM_LEARNERS);
                const learner = learnersData[randIdx];
                const learnerSkillSet = (learner as any).skillSet;

                if (!learnerSkillSet.has(skill.id)) {
                    learner.skills.push(skill);
                    learnerSkillSet.add(skill.id);
                    if (skill.sector) learner.sectors.add(skill.sector);
                    
                    count++;
                    skillAssignmentCount.set(skill.id, count);
                    added = true;
                }
                attempts++;
            }
            
            if (!added) {
                // Should practically never happen with 50 learners unless logic is broken
                console.warn(`Could not assign skill ${skill.id} to more users (Attempts: ${attempts})`);
                break;
            }
        }
    });

    console.log('Seeding learners...');

    for (const lData of learnersData) {
        // Skip if no skills assigned (unlikely if skills > learners)
        if (lData.skills.length === 0) continue;

        // Upsert learner
        const learner = await prisma.learner.upsert({
            where: { email: lData.email },
            update: {},
            create: {
                name: lData.name,
                email: lData.email,
                phone: lData.phone,
                hashed_password: passwordHash,
                status: 'active',
                profileUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${lData.name}`,
                // basic profile
                dob: new Date('2000-01-01'),
                gender: 'Prefer not to say'
            }
        });

        // Clean up existing credentials for this test learner to ensure fresh, correct data set
        await prisma.credential.deleteMany({ where: { learner_id: learner.id } });

        // Create multiple dummy credentials (3-5) to ensure diversity and filterability
        // Strategy:
        // 1. Guaranteed coverage: each learner gets 2 specific sectors based on index to ensure global 2x coverage.
        // 2. Add random other credentials.
        
        const numCredentials = 3 + Math.floor(Math.random() * 3); // 3 to 5
        
        // Use GLOBAL sectors list for consistent indexing
        const allGlobalSectors = Array.from(sectors).sort(); 
        const totalSectors = allGlobalSectors.length;
        
        const index = learnersData.indexOf(lData);
        const mandatorySector1 = allGlobalSectors[index % totalSectors];
        const mandatorySector2 = allGlobalSectors[(index + Math.floor(totalSectors / 2)) % totalSectors];
        
        const mandatorySectors = new Set([mandatorySector1, mandatorySector2]);
        
        // Pick skills for credentials
        const chosenSkills: any[] = [];
        const usedSectors = new Set<string>();

        // 1. Add mandatory skills
        for (const sec of mandatorySectors) {
             // Find a skill from this learner's skill set that matches the sector
             // (Learner has ALL sectors skills due to previous logic)
             const skillInSector = lData.skills.find(s => s.sector === sec);
             if (skillInSector) {
                 chosenSkills.push(skillInSector);
                 usedSectors.add(sec);
             }
        }

        // 2. Fill rest with randoms distinct from mandatory
        const shuffledForCreds = [...lData.skills].sort(() => 0.5 - Math.random());

        for (const skill of shuffledForCreds) {
            if (chosenSkills.length >= numCredentials) break;
            if (skill.sector && !usedSectors.has(skill.sector)) {
                chosenSkills.push(skill);
                usedSectors.add(skill.sector);
            }
        }
        
        // Fill if still not enough (duplicate sectors allowed if clean distinct fails, but avoid same skill)
        if (chosenSkills.length < numCredentials) {
            for (const skill of shuffledForCreds) {
                if (chosenSkills.length >= numCredentials) break;
                if (!chosenSkills.includes(skill)) chosenSkills.push(skill);
            }
        }

        // Create the credentials
        const issuer = await prisma.issuer.findFirst(); 
        let issuerId = issuer?.id;
         if (!issuerId) {
             const newIssuer = await prisma.issuer.create({
                 data: {
                     name: "Test Issuer",
                     email: "issuer@test.com",
                     password_hash: "hash",
                     status: "approved",
                     type: "Government Body"
                 }
             });
             issuerId = newIssuer.id;
        }

        for (const [idx, skill] of chosenSkills.entries()) {
             // Check if already exists (skip to avoid unique constraint if re-seeding same randoms, though ids differ)
             // We use a deterministic logic or just allow multiple? 
             // With random ID it's fine.
            
             const mockMetadata = {
                 description: `Certified ${skill.title || skill.job_role}`,
                 ai_extracted: {
                     skills: [skill.title || skill.job_role],
                     nsqf_alignment: {
                         level: skill.nsqf_level || 4,
                         code: skill.qp_code || 'N/A'
                     },
                     nos_data: {
                         qp_role: skill.job_role,
                         sector: skill.sector
                     }
                 },
                 // Mocking other stats
                 score: 80 + Math.floor(Math.random() * 20)
             };

             await prisma.credential.create({
                data: {
                    learner_id: learner.id,
                    learner_email: learner.email!,
                    issuer_id: issuerId,
                    certificate_title: `Certificate in ${skill.title || skill.job_role}`,
                    issued_at: new Date(new Date().setDate(new Date().getDate() - idx * 10)), // Spread dates
                    data_hash: `mock_hash_${learner.id}_${skill.id}`,
                    metadata: mockMetadata,
                    status: 'issued',
                    credential_id: `MOCK-${learner.id}-${skill.id}-${Date.now()}`,
                    sector: skill.sector,
                    nsqf_level: skill.nsqf_level || 4
                } as any
            });
        }

        // Format skill profile data
        // Frontend expects topSkills to be objects { skill: string, ... }

        // Shuffle skills to ensure Top 10 are diverse and not just the first few sectors
        const shuffledSkills = [...lData.skills].sort(() => 0.5 - Math.random());
        
        const topSkills = shuffledSkills.slice(0, 10).map(s => ({
            skill: s.title || s.job_role || 'Unknown Skill',
            level: 'Advanced' // dummy level
        }));
        
        const allSkillNames = lData.skills.map(s => s.title || s.job_role || 'Unknown Skill');
        
        // Generate keywords list
        const keywords = Array.from(new Set(lData.skills.flatMap(s => s.keywords || [])));

        const skillProfileData = {
            overview: `Skilled in ${Array.from(lData.sectors).join(', ')}`,
            topSkills: topSkills,
            allSkills: allSkillNames,
            sectors: Array.from(lData.sectors),
            keywords: keywords,
            // Add some "AI" inferred stats keys if needed by frontend
            stats: {
                totalSkills: allSkillNames.length,
                primarySector: Array.from(lData.sectors)[0]
            }
        };

        const existingProfile = await prisma.learnerSkillProfile.findUnique({ where: { learner_id: learner.id } });
        if (existingProfile) {
            await prisma.learnerSkillProfile.update({
             where: { learner_id: learner.id },
             data: { data: skillProfileData }
            });
        } else {
            await prisma.learnerSkillProfile.create({
                data: {
                    learner_id: learner.id,
                    data: skillProfileData
                }
            });
        }
    }

    console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const credentials = await prisma.credential.findMany({
      take: 5,
      select: {
        id: true,
        credential_id: true,
        certificate_title: true
      }
    });

    console.log('Sample Credentials:', credentials);
    
    // Check if any match the partials we saw
    const partials = ['2851e07c', '2418d781', '94f799ff'];
    for (const p of partials) {
        const found = await prisma.credential.findFirst({
            where: {
                credential_id: {
                    contains: p
                }
            }
        });
        if (found) {
            console.log(`Found match for partial ${p}:`, found.credential_id);
        } else {
            console.log(`No match for partial ${p}`);
        }
    }

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

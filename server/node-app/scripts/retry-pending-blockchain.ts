import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3001';

async function retryPendingCredentials() {
    console.log('🔍 Searching for pending credentials...\n');

    // Find credentials with null tx_hash
    const pendingCredentials = await prisma.credential.findMany({
        where: {
            tx_hash: null
        },
        select: {
            credential_id: true,
            data_hash: true,
            ipfs_cid: true,
            certificate_title: true,
            learner_email: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    console.log(`Found ${pendingCredentials.length} pending credentials\n`);

    if (pendingCredentials.length === 0) {
        console.log('✅ No pending credentials found!');
        await prisma.$disconnect();
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const cred of pendingCredentials) {
        try {
            console.log(`📝 Processing: ${cred.certificate_title} (${cred.learner_email})`);
            console.log(`   Credential ID: ${cred.credential_id}`);
            
            // Call blockchain service
            const response = await axios.post(
                `${BLOCKCHAIN_SERVICE_URL}/blockchain/write`,
                {
                    credential_id: cred.credential_id,
                    data_hash: cred.data_hash,
                    ipfs_cid: cred.ipfs_cid || '',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 120000, // 2 minutes
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Blockchain write failed');
            }

            const { tx_hash } = response.data.data;

            // Update credential in database
            await prisma.credential.update({
                where: { credential_id: cred.credential_id },
                data: {
                    tx_hash: tx_hash,
                    metadata: {
                        blockchain_status: 'confirmed',
                        blockchain: {
                            network: response.data.data.network,
                            contract_address: response.data.data.contract_address,
                            tx_hash: tx_hash
                        }
                    }
                }
            });

            console.log(`   ✅ SUCCESS! TX Hash: ${tx_hash}\n`);
            successCount++;

        } catch (error: any) {
            console.log(`   ❌ FAILED: ${error.message}\n`);
            failCount++;

            // Mark as failed in database
            try {
                await prisma.credential.update({
                    where: { credential_id: cred.credential_id },
                    data: {
                        metadata: {
                            blockchain_status: 'failed',
                            blockchain_error: error.message
                        }
                    }
                });
            } catch (updateError) {
                console.log(`   ⚠️  Could not mark as failed in database`);
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📝 Total processed: ${pendingCredentials.length}`);

    await prisma.$disconnect();
}

// Run the script
retryPendingCredentials()
    .then(() => {
        console.log('\n🎉 Script completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });

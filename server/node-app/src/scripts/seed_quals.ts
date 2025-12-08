
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const dataDir = path.join(__dirname, '../../data');
    const qpFile = path.join(dataDir, 'Qualifications 30-11-2025 08_17_20.xlsx');

    if (!fs.existsSync(qpFile)) {
        console.error(`File not found: ${qpFile}`);
        process.exit(1);
    }

    console.log(`Reading ${qpFile}...`);
    const workbook = XLSX.readFile(qpFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Header is on row 4 (index 3), data starts row 5 (index 4)
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 4 });

    console.log(`Found ${rows.length} rows. parsing...`);

    let count = 0;
    for (const row of rows) {
        // Mapping based on inspection of Qualifications 30-11-2025 08_17_20.xlsx
        // 0: Index
        // 1: Title
        // 2: QP Code
        // 3: Description
        // 4: Sector
        // 5: NSQF Level (e.g. "Level 5")
        // 6: Duration 
        // 7: Notional Hours
        // 11: Awarding Body / Certifying Body
        // 13: Sub-Sector / Occupation?
        // 14: Progression Pathways
        // 17: Credits JSON
        
        const title = row[1];
        const qpCode = row[2];
        const description = row[3];
        const sector = row[4];
        const nsqfRaw = row[5];
        const notionalHours = row[7]; // or 6?
        const certifyingBody = row[11];
        const subSector = row[13];
        const progression = row[14];
        const creditsRaw = row[17];
        
        if (!qpCode || !title) continue;

        // Parse NSQF level ("Level 5" -> 5)
        let nsqfLevel = null;
        if (typeof nsqfRaw === 'string') {
            const match = nsqfRaw.match(/Level\s*(\d+(\.\d+)?)/i);
            if (match) nsqfLevel = parseFloat(match[1]);
        } else if (typeof nsqfRaw === 'number') {
            nsqfLevel = nsqfRaw;
        }

        // Parse Credits JSON
        let creditsDetails = null;
        if (creditsRaw) {
            try {
                creditsDetails = JSON.parse(creditsRaw);
            } catch (e) {
                // simple string? leave as is or ignore
            }
        }

        // Upsert
        const existing = await prisma.skillKnowledgeBase.findFirst({ where: { qp_code: qpCode } });
        const updateData: any = {
            job_role: title,
            title: title,
            description: description,
            nsqf_level: nsqfLevel ? Math.floor(nsqfLevel) : null,
            sector: sector,
            sub_sector: subSector,
            certifying_body: certifyingBody,
            progression_pathways: progression,
            notional_hours: notionalHours ? String(notionalHours) : null,
            credits_breakdown: creditsDetails || undefined, // undefined to skip if null for update?
            source_type: 'QP' // "Future Skills Qualification" etc in col 15?
        };

        if (existing) {
             await prisma.skillKnowledgeBase.update({
                where: { id: existing.id },
                data: updateData
             });
        } else {
            await prisma.skillKnowledgeBase.create({
                data: {
                    qp_code: qpCode,
                    ...updateData,
                    keywords: [subSector].filter(Boolean) as string[]
                }
            });
        }
        count++;
        if (count % 50 === 0) console.log(`Processed ${count}...`);
    }

    console.log(`Seeding complete. Inserted ${count} records.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

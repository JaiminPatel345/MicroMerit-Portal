
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

function parseDate(dateStr: any): Date | undefined {
    if (!dateStr || dateStr === 'N.A.') return undefined;
    // Excel might return a number (days since 1900) or a string
    if (typeof dateStr === 'number') {
        // Convert Excel date to JS Date
        return new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? undefined : d;
}

function parseLevel(levelStr: any): number | undefined {
    if (!levelStr) return undefined;
    if (typeof levelStr === 'number') return levelStr;
    const match = levelStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
}

async function main() {
    // Determine path relative to this script (prisma/seed_nqr.ts)
    // We want to go up one level to node-app, then into data
    const filePath = path.join(__dirname, '../data/nqr.xlsx');
    console.log(`Reading file from ${filePath}`);

    // Try finding file in relative path if absolute fails (adjust based on CWD)
    let workbook;
    try {
        workbook = XLSX.readFile(filePath);
    } catch (e) {
        console.log('Retry adjusting path...');
        workbook = XLSX.readFile(path.join(process.cwd(), 'server/node-app/data/nqr.xlsx'));
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Headers are at row index 2 (Row 3 in Excel)
    // Data starts at row index 3
    const range = XLSX.utils.decode_range(sheet['!ref']!);
    
    let successCount = 0;
    let errorCount = 0;

    console.log('Starting seed...');

    for (let R = 3; R <= range.e.r; ++R) {
        try {
            // Helper to safe read cell
            const getVal = (idx: number) => {
                const cell = sheet[XLSX.utils.encode_cell({r:R, c:idx})];
                return cell ? cell.v : null;
            };

            const title = getVal(1) as string;
            const qp_code = getVal(2) as string;
            
            if (!qp_code) continue; // Skip empty rows

            const description = getVal(3) as string;
            const sector = getVal(4) as string;
            const nsqf_level_raw = getVal(5);
            const max_hours = getVal(6) as string;
            const min_hours = getVal(7) as string;
            const version = getVal(8) as string;
            const approved_date = getVal(9);
            const valid_till = getVal(10);
            const awarding_body = getVal(11) as string;
            const certifying_body = getVal(12) as string;
            const proposed_occupation = getVal(13) as string;
            const progression_pathways = getVal(14) as string;
            const qualification_type = getVal(15) as string;
            const adopted_qualification = getVal(16) as string;
            const training_delivery_hours_raw = getVal(17);

            let training_delivery_hours = {};
            if (typeof training_delivery_hours_raw === 'string') {
                try {
                    training_delivery_hours = JSON.parse(training_delivery_hours_raw);
                } catch (e) {}
            }

            const data = {
                title,
                qp_code, // Main unique identifier?
                description,
                sector,
                nsqf_level: parseLevel(nsqf_level_raw),
                max_notional_hours: String(max_hours || ''),
                min_notional_hours: String(min_hours || ''),
                version: String(version || ''),
                originally_approved: parseDate(approved_date),
                valid_till: parseDate(valid_till),
                awarding_body,
                certifying_body,
                proposed_occupation,
                progression_pathways,
                qualification_type,
                adopted_qualification,
                training_delivery_hours: training_delivery_hours || {},
                source_type: 'NQR',
                // Legacy mapping or defaults
                job_role: proposed_occupation || title, 
                // nos_code is not in this sheet, leave null
            };

            // Upsert based on qp_code? The schema doesn't force qp_code unique but let's assume it should be de-duped
            // We'll use findFirst to check existence then update or create
            
            const existing = await prisma.skillKnowledgeBase.findFirst({
                where: { qp_code: qp_code }
            });

            if (existing) {
                await prisma.skillKnowledgeBase.update({
                    where: { id: existing.id },
                    data
                });
            } else {
                await prisma.skillKnowledgeBase.create({
                    data
                });
            }

            process.stdout.write('.');
            successCount++;

        } catch (err: any) {
            console.error(`\nError at row ${R}: ${err.message}`);
            errorCount++;
        }
    }

    console.log(`\n\nSeeding complete.`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

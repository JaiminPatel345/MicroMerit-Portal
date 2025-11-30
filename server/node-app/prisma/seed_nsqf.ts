import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

// Extract keywords
function extractKeywords(text?: string | null): string[] {
    if (!text) return [];

    return text
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .split(" ")
        .filter((w) => w.length > 2);
}

async function main() {
    console.log("🚀 Starting seeding...");

    // --------------------------
    // 1️⃣ Load QP spreadsheet
    // --------------------------
    const qpWorkbook = XLSX.readFile("./data/View List of QPs30_11_2025.xls");
    const qpSheet = qpWorkbook.Sheets[qpWorkbook.SheetNames[0]];
    const qpRows = XLSX.utils.sheet_to_json(qpSheet);

    console.log(`📘 Found ${qpRows.length} QP rows`);

    for (const row of qpRows as any[]) {
        const qp_code = row["QP/Job Role Code"] || row["QP Code"] || row["QPCode"];
        if (!qp_code) continue;

        const job_role = row["QP/Job Role Name"] || row["Job Role"] || row["JobRole"];
        const description = row["Occupation"] || row["Description"] || "";
        const nsqf_level = parseInt(row["NSQF Level"] || row["NSQFLevel"] || 0);
        const sector = row["Sector"] || "IT-ITeS";

        const keywords = extractKeywords(`${job_role} ${description}`);

        await prisma.skillKnowledgeBase.create({
            data: {
                source_type: "QP",
                qp_code,
                job_role,
                nsqf_level,
                sector,
                title: job_role,
                description,
                keywords
            }
        });

        // console.log(`✔ Inserted QP ${qp_code}`);
    }

    // --------------------------
    // 2️⃣ Load NOS spreadsheet
    // --------------------------
    const nosWorkbook = XLSX.readFile("./data/Qualifications 30-11-2025 08_17_20.xlsx");
    const nosSheet = nosWorkbook.Sheets[nosWorkbook.SheetNames[0]];
    const nosRows = XLSX.utils.sheet_to_json(nosSheet);

    console.log(`📙 Found ${nosRows.length} NOS rows`);

    for (const row of nosRows as any[]) {
        // Based on debug output: __EMPTY_1 is Code, __EMPTY is Title, __EMPTY_2 is Description
        const nos_code = row["__EMPTY_1"] || row["NOS Code"] || row["NOSCode"];

        // Skip if code is missing or if it's the header row
        if (!nos_code || nos_code === "Code") continue;

        // QP Code is not directly in NOS sheet based on the log (it had Sector, Level etc). 
        // We might not have QP Code in NOS sheet? 
        // The previous code tried row["QP Code"]. 
        // Let's assume for now we don't have it or it's in another column we didn't see.
        // If we look at the keys: 'Downloaded on...' -> 'Sector Name'.
        // There is no obvious QP Code column in the first few keys.
        // We will leave qp_code as null or try to find it if possible. 
        // For now let's just map what we have.
        const qp_code = row["QP Code"] || row["QPCode"] || null;

        const title = row["__EMPTY"] || row["NOS Title"] || row["NOSTitle"];
        const description = row["__EMPTY_2"] || row["Description"] || row["NOS Description"] || "";

        const keywords = extractKeywords(`${title} ${description}`);

        await prisma.skillKnowledgeBase.create({
            data: {
                source_type: "NOS",
                qp_code,
                nos_code,
                title,
                description,
                keywords
            }
        });

        // console.log(`✔ Inserted NOS ${nos_code}`);
    }

    // --------------------------
    // 3️⃣ Optional: auto-generate skills for NOS
    // --------------------------
    console.log("🛠 Generating skills...");

    const nosEntries = await prisma.skillKnowledgeBase.findMany({
        where: { source_type: "NOS" }
    });

    const genericSkills = ["Fundamentals", "Execution", "Testing", "Quality", "Reporting"];

    for (const nos of nosEntries) {
        for (const skill of genericSkills) {
            const skill_text = `${nos.title} - ${skill}`;

            await prisma.skillKnowledgeBase.create({
                data: {
                    source_type: "Skill",
                    qp_code: nos.qp_code,
                    nos_code: nos.nos_code,
                    skill_text,
                    keywords: extractKeywords(skill_text)
                }
            });
        }
        console.log(`✔ Skills added for NOS ${nos.nos_code}`);
    }

    console.log("🎉 DONE — All data seeded!");
}

main()
    .catch((err) => {
        console.error("❌ Seed error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

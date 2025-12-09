/**
 * Hardcoded seed data extracted from Excel files
 * Contains real qualification data from NQR
 */

import { MockCredential, TEST_USERS } from '../types';

// Real qualification data extracted from Excel files
const QUALIFICATIONS = [
    // IT-ITeS Sector
    {
        title: "AI – Business Intelligence Analyst",
        code: "2020/ITES/ITSSC/04327",
        description: "Individuals at this job are responsible for importing data from various internal and external sources. They preprocess data to meet desired quality standards for analysis.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 480,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics"
    },
    {
        title: "AI – Data Architect",
        code: "2020/ITES/ITSSC/04330",
        description: "Individuals at this job are responsible for architecting data solutions, designing data pipelines, and ensuring data infrastructure meets business requirements.",
        sector: "IT-ITeS",
        level: 6,
        maxHours: 570,
        minHours: 570,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics"
    },
    {
        title: "AI – Data Quality Analyst",
        code: "2020/ITES/ITSSC/04331",
        description: "Individuals at this job are responsible for importing data from various internal and external sources and preprocessing it to meet desired quality standards.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 480,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics"
    },
    {
        title: "AI – Data Scientist",
        code: "2020/ITES/ITSSC/04329",
        description: "Individuals at this job perform different elements of data science including importing data, preprocessing, exploratory analysis, and conducting research on algorithmic models.",
        sector: "IT-ITeS",
        level: 6,
        maxHours: 780,
        minHours: 720,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics"
    },
    {
        title: "AI - Database Administrator",
        code: "2020/ITES/ITSSC/04325",
        description: "Individuals at this job will be responsible for storing data from a variety of internal and external sources in databases, updating information and maintaining the database.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 450,
        minHours: 450,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics"
    },
    {
        title: "AI – DevOps Engineer",
        code: "2020/ITES/ITSSC/04324",
        description: "Individuals at this job are responsible for managing production systems, developing tools and processes for continuous integration and delivery of applications.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 480,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics"
    },
    {
        title: "AI – Machine Learning Engineer",
        code: "2020/ITES/ITSSC/04323",
        description: "Individuals at this job are responsible for developing applications and platforms in AI & Big Data Analytics, evaluating technical performance of algorithmic models.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 480,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics"
    },
    // Agriculture Sector
    {
        title: "Krishi Sahayak",
        code: "2022/AGR/ASCI/06446",
        description: "A Krishi Sahayak is responsible for creating awareness and building capacity of farmer/rural household members on agricultural activities and facilitates marketing of agricultural produce.",
        sector: "Agriculture",
        level: 3,
        maxHours: 300,
        minHours: 300,
        awardingBody: "Agriculture Skill Council of India (ASCI)",
        certifyingBody: "Agriculture Skill Council of India (ASCI)",
        occupation: "Agri-Information Management"
    },
    {
        title: "Vriksh Sanrakshak",
        code: "QG-04-AG-00092-2023-V1-ASCI",
        description: "A Vriksh Sanrakshak is responsible for planting, maintaining, and removing trees, woody plants and shrubs. Involves pruning and managing pest/disease control.",
        sector: "Agriculture",
        level: 4,
        maxHours: 390,
        minHours: 390,
        awardingBody: "Agriculture Skill Council of India (ASCI)",
        certifyingBody: "Agriculture Skill Council of India (ASCI)",
        occupation: "Agro-Forestry Management"
    },
    {
        title: "Agri Technician",
        code: "QG-04-AG-00093-2023-V1-ASCI",
        description: "An Agri Technician is responsible for operating and maintaining agricultural machinery and equipment for farming operations.",
        sector: "Agriculture",
        level: 4,
        maxHours: 420,
        minHours: 400,
        awardingBody: "Agriculture Skill Council of India (ASCI)",
        certifyingBody: "Agriculture Skill Council of India (ASCI)",
        occupation: "Agricultural Machinery Operation"
    },
    {
        title: "Organic Farming Specialist",
        code: "QG-05-AG-00094-2023-V1-ASCI",
        description: "An Organic Farming Specialist is responsible for implementing organic farming practices, soil health management, and sustainable agriculture methods.",
        sector: "Agriculture",
        level: 5,
        maxHours: 500,
        minHours: 450,
        awardingBody: "Agriculture Skill Council of India (ASCI)",
        certifyingBody: "Agriculture Skill Council of India (ASCI)",
        occupation: "Organic Farming"
    },
    // Handicrafts & Carpets Sector
    {
        title: "Block Printing Artisan",
        code: "QG-04-HC-00150-2023-V1-HCSC",
        description: "A Block Printing Artisan is skilled in traditional block printing techniques, fabric preparation, and color mixing for creating handcrafted textiles.",
        sector: "Handicrafts & Carpets",
        level: 4,
        maxHours: 350,
        minHours: 320,
        awardingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        certifyingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        occupation: "Textile Printing"
    },
    {
        title: "Carpet Weaver",
        code: "QG-04-HC-00151-2023-V1-HCSC",
        description: "A Carpet Weaver is responsible for hand-weaving traditional carpets using various techniques, pattern creation, and quality finishing.",
        sector: "Handicrafts & Carpets",
        level: 4,
        maxHours: 600,
        minHours: 550,
        awardingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        certifyingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        occupation: "Carpet Manufacturing"
    },
    {
        title: "Pottery Craftsman",
        code: "QG-03-HC-00152-2023-V1-HCSC",
        description: "A Pottery Craftsman is skilled in traditional pottery making including wheel throwing, hand building, glazing, and firing techniques.",
        sector: "Handicrafts & Carpets",
        level: 3,
        maxHours: 280,
        minHours: 250,
        awardingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        certifyingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        occupation: "Pottery and Ceramics"
    },
    // Wood & Carpentry Sector
    {
        title: "Master Carpenter",
        code: "QG-05-WC-00830-2023-V2-FFSC",
        description: "The Master Carpenter plays the primary role of project supervision at the worksite, assisting in client coordination and vendor management of materials.",
        sector: "Wood & Carpentry",
        level: 5,
        maxHours: 720,
        minHours: 720,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Installation & After Sales"
    },
    {
        title: "Multipurpose Assistant- Furniture Business Development",
        code: "QG-03-WC-00822-2023-V1-FFSC",
        description: "Multipurpose Assistant provides support in various business development activities including market research, client communication, and sales distribution.",
        sector: "Wood & Carpentry",
        level: 3,
        maxHours: 540,
        minHours: 390,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Business Development & Distribution"
    },
    {
        title: "Multipurpose Assistant- Furniture Production & Installation",
        code: "QG-03-WC-00819-2023-V1-FFSC",
        description: "Multipurpose Assistant assists in interpreting work dockets, conducting work site recce, compiling lists of required materials, tools, and equipment.",
        sector: "Wood & Carpentry",
        level: 3,
        maxHours: 630,
        minHours: 420,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Production (Workshop)"
    },
    {
        title: "Multipurpose Draughtsperson (Design and Build)",
        code: "QG-03-WC-00818-2023-V1-FFSC",
        description: "Multipurpose Draughtsperson is responsible for assisting in converting designs into 2D/3D drawings and performing site surveys and measurements.",
        sector: "Wood & Carpentry",
        level: 3,
        maxHours: 540,
        minHours: 390,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Interior Designing"
    },
    {
        title: "Panelworks Machine Operator",
        code: "QG-4.5-WC-00821-2023-V1-FFSC",
        description: "The Panelworks Machine Operator operates and monitors machinery used in the production of panels for various applications.",
        sector: "Wood & Carpentry",
        level: 4,
        maxHours: 720,
        minHours: 570,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Production (Machine Shop)"
    },
    {
        title: "Carpenter (WorldSkills)",
        code: "QG-4.5-WC-01791-2024-V1-FFSC",
        description: "The WorldSkills-Certified Carpenter conducts on-site surveys, interprets blueprints, and prepares worksites with precision using hand tools and machines.",
        sector: "Wood & Carpentry",
        level: 4,
        maxHours: 510,
        minHours: 510,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Installation and After Sales"
    },
    {
        title: "Joiner (WorldSkills)",
        code: "QG-4.5-WC-01790-2024-V1-FFSC",
        description: "The WorldSkills-Certified Joiner conducts thorough site surveys, interprets complex blueprints, and showcases unmatched craftsmanship through precise work.",
        sector: "Wood & Carpentry",
        level: 4,
        maxHours: 510,
        minHours: 510,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Production (Work Shop)"
    },
    // Additional IT-ITeS
    {
        title: "Full Stack Web Developer",
        code: "2021/ITES/ITSSC/05001",
        description: "Individuals at this job are responsible for developing both front-end and back-end components of web applications using modern frameworks and technologies.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 520,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Software Development"
    },
    {
        title: "Cloud Computing Associate",
        code: "2021/ITES/ITSSC/05002",
        description: "Individuals at this job are responsible for deploying, managing, and monitoring cloud infrastructure services across major cloud platforms.",
        sector: "IT-ITeS",
        level: 4,
        maxHours: 400,
        minHours: 380,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Cloud Computing"
    },
    {
        title: "Cybersecurity Analyst",
        code: "2021/ITES/ITSSC/05003",
        description: "Individuals at this job are responsible for monitoring security systems, identifying vulnerabilities, and implementing security measures to protect organizational data.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 500,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Information Security"
    },
    {
        title: "UI/UX Designer",
        code: "2021/ITES/ITSSC/05004",
        description: "Individuals at this job are responsible for designing user interfaces and user experiences for digital products using design thinking principles.",
        sector: "IT-ITeS",
        level: 4,
        maxHours: 360,
        minHours: 340,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Digital Design"
    },
    {
        title: "Quality Assurance Engineer",
        code: "2021/ITES/ITSSC/05005",
        description: "Individuals at this job are responsible for testing software applications, creating test cases, and ensuring product quality through automated and manual testing.",
        sector: "IT-ITeS",
        level: 4,
        maxHours: 380,
        minHours: 360,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Software Testing"
    }
];

function getProviderForIndex(index: number): 'nsdc' | 'udemy' | 'jaimin' | 'sih' {
    const providers: ('nsdc' | 'udemy' | 'jaimin' | 'sih')[] = ['nsdc', 'udemy', 'jaimin', 'sih'];
    return providers[index % 4];
}

function generateIssuedDate(index: number): Date {
    // Generate dates spread over the last 30 days
    // More recent credentials for lower indices
    const now = new Date();
    const daysAgo = Math.floor(index / 3); // Spread credentials over days
    const hoursOffset = (index % 24); // Spread within a day

    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hoursOffset);

    return date;
}

function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Generate mock credentials for each test user from each qualification
function generateCredentials(): MockCredential[] {
    const credentials: MockCredential[] = [];
    let globalIndex = 0;

    // Each qualification generates multiple credentials for different users
    QUALIFICATIONS.forEach((qual, qualIndex) => {
        // Assign each qualification to 1-2 random test users
        const userCount = 1 + (qualIndex % 2);

        for (let u = 0; u < userCount; u++) {
            const userIndex = (qualIndex + u) % TEST_USERS.length;
            const user = TEST_USERS[userIndex];
            const provider = getProviderForIndex(globalIndex);

            credentials.push({
                id: generateId(),
                learner_email: user.email,
                learner_name: user.name,
                certificate_title: qual.title,
                certificate_code: qual.code,
                issued_at: generateIssuedDate(globalIndex),
                sector: qual.sector,
                nsqf_level: qual.level,
                max_hr: qual.maxHours,
                min_hr: qual.minHours,
                awarding_bodies: [qual.awardingBody],
                occupation: qual.occupation,
                tags: [provider, 'nsqf', 'skill-india'],
                description: qual.description,
                provider,
            });

            globalIndex++;
        }
    });

    // Sort by issued_at descending (newest first)
    credentials.sort((a, b) => b.issued_at.getTime() - a.issued_at.getTime());

    console.log(`Generated ${credentials.length} mock credentials from ${QUALIFICATIONS.length} qualifications`);
    return credentials;
}

// Singleton to hold all credentials
let allCredentials: MockCredential[] | null = null;
// Track generated dynamic credentials per provider
const dynamicCredentialCounts: Record<string, number> = {
    nsdc: 0,
    udemy: 0,
    jaimin: 0,
    sih: 0
};

// Last fetch time per provider - to ensure new credentials on force fetch
const lastFetchTime: Record<string, Date> = {};

export function getCredentials(): MockCredential[] {
    if (!allCredentials) {
        allCredentials = generateCredentials();
    }
    return allCredentials;
}

export function getCredentialsByProvider(provider: 'nsdc' | 'udemy' | 'jaimin' | 'sih'): MockCredential[] {
    return getCredentials().filter(c => c.provider === provider);
}

// Generate a new dynamic credential for a provider
function generateDynamicCredential(provider: 'nsdc' | 'udemy' | 'jaimin' | 'sih'): MockCredential {
    dynamicCredentialCounts[provider]++;
    const count = dynamicCredentialCounts[provider];

    // Pick a random qualification
    const qualIndex = Math.floor(Math.random() * QUALIFICATIONS.length);
    const qual = QUALIFICATIONS[qualIndex];

    // Pick a random test user
    const userIndex = Math.floor(Math.random() * TEST_USERS.length);
    const user = TEST_USERS[userIndex];

    const now = new Date();

    return {
        id: generateId(),
        learner_email: user.email,
        learner_name: user.name,
        certificate_title: `${qual.title} (Dynamic #${count})`,
        certificate_code: `${qual.code}-DYN-${count}`,
        issued_at: now,
        sector: qual.sector,
        nsqf_level: qual.level,
        max_hr: qual.maxHours,
        min_hr: qual.minHours,
        awarding_bodies: [qual.awardingBody],
        occupation: qual.occupation,
        tags: [provider, 'nsqf', 'skill-india', 'dynamic'],
        description: qual.description,
        provider,
    };
}

export function getCredentialsSince(
    provider: 'nsdc' | 'udemy' | 'jaimin' | 'sih',
    since: Date,
    limit: number = 10,
    offset: number = 0
): { credentials: MockCredential[]; total: number; hasMore: boolean } {
    // Check if this is a new fetch (force fetch) - add at least one credential
    const now = new Date();
    const lastFetch = lastFetchTime[provider];

    // If it's been more than 10 seconds since last fetch, generate a new credential
    if (!lastFetch || (now.getTime() - lastFetch.getTime() > 10000)) {
        const newCred = generateDynamicCredential(provider);
        allCredentials = allCredentials || generateCredentials();
        allCredentials.unshift(newCred); // Add to beginning
        console.log(`Generated new dynamic credential for ${provider}: ${newCred.certificate_title}`);
    }
    lastFetchTime[provider] = now;

    const providerCreds = getCredentialsByProvider(provider)
        .filter(c => c.issued_at > since);

    const total = providerCreds.length;
    const credentials = providerCreds.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { credentials, total, hasMore };
}

// Reset credentials (for testing)
export function resetCredentials(): void {
    allCredentials = null;
    dynamicCredentialCounts.nsdc = 0;
    dynamicCredentialCounts.udemy = 0;
    dynamicCredentialCounts.jaimin = 0;
    dynamicCredentialCounts.sih = 0;
    Object.keys(lastFetchTime).forEach(k => delete lastFetchTime[k]);
}


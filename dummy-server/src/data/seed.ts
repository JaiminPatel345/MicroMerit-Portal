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
        qp_code: "2020/ITES/ITSSC/04327",
        nos_code: "SSC/N9001",
        job_role: "Business Intelligence Analyst",
        description: "Individuals at this job are responsible for importing data from various internal and external sources. They preprocess data to meet desired quality standards for analysis.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 480,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics",
        skill_text: "Data analysis, Business intelligence tools, Data preprocessing, SQL, Data visualization",
        keywords: ["business intelligence", "data analysis", "bi tools", "sql", "analytics"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2020-01-01"),
        valid_till: new Date("2028-12-31"),
        proposed_occupation: "Artificial Intelligence and Big Data Analytics",
        progression_pathways: "Senior BI Analyst, Data Architect",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 240, practical: 240 }
    },
    {
        title: "AI – Data Architect",
        code: "2020/ITES/ITSSC/04330",
        qp_code: "2020/ITES/ITSSC/04330",
        nos_code: "SSC/N9002",
        job_role: "Data Architect",
        description: "Individuals at this job are responsible for architecting data solutions, designing data pipelines, and ensuring data infrastructure meets business requirements.",
        sector: "IT-ITeS",
        level: 6,
        maxHours: 570,
        minHours: 570,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics",
        skill_text: "Data architecture, Pipeline design, ETL, Cloud platforms, Data modeling",
        keywords: ["data architecture", "etl", "data pipeline", "cloud", "data modeling"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2020-01-01"),
        valid_till: new Date("2028-12-31"),
        proposed_occupation: "Artificial Intelligence and Big Data Analytics",
        progression_pathways: "Chief Data Officer, Enterprise Architect",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 285, practical: 285 }
    },
    {
        title: "AI – Data Quality Analyst",
        code: "2020/ITES/ITSSC/04331",
        qp_code: "2020/ITES/ITSSC/04331",
        nos_code: "SSC/N9003",
        job_role: "Data Quality Analyst",
        description: "Individuals at this job are responsible for importing data from various internal and external sources and preprocessing it to meet desired quality standards.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 480,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics",
        skill_text: "Data quality assessment, Data cleansing, Data validation, Quality metrics, Data governance",
        keywords: ["data quality", "data cleansing", "validation", "governance", "quality metrics"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2020-01-01"),
        valid_till: new Date("2028-12-31"),
        proposed_occupation: "Artificial Intelligence and Big Data Analytics",
        progression_pathways: "Senior Data Quality Lead, Data Governance Manager",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 240, practical: 240 }
    },
    {
        title: "AI – Data Scientist",
        code: "2020/ITES/ITSSC/04329",
        qp_code: "2020/ITES/ITSSC/04329",
        nos_code: "SSC/N9004",
        job_role: "Data Scientist",
        description: "Individuals at this job perform different elements of data science including importing data, preprocessing, exploratory analysis, and conducting research on algorithmic models.",
        sector: "IT-ITeS",
        level: 6,
        maxHours: 780,
        minHours: 720,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics",
        skill_text: "Machine learning, Statistical analysis, Python, R, Deep learning, Data mining",
        keywords: ["data science", "machine learning", "python", "statistics", "deep learning"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2020-01-01"),
        valid_till: new Date("2028-12-31"),
        proposed_occupation: "Artificial Intelligence and Big Data Analytics",
        progression_pathways: "Senior Data Scientist, ML Architect, AI Research Lead",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 390, practical: 390 }
    },
    {
        title: "AI - Database Administrator",
        code: "2020/ITES/ITSSC/04325",
        qp_code: "2020/ITES/ITSSC/04325",
        nos_code: "SSC/N9005",
        job_role: "Database Administrator",
        description: "Individuals at this job will be responsible for storing data from a variety of internal and external sources in databases, updating information and maintaining the database.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 450,
        minHours: 450,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics",
        skill_text: "Database management, SQL, NoSQL, Database optimization, Backup and recovery",
        keywords: ["database", "dba", "sql", "nosql", "database management"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2020-01-01"),
        valid_till: new Date("2028-12-31"),
        proposed_occupation: "Artificial Intelligence and Big Data Analytics",
        progression_pathways: "Senior DBA, Database Architect",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 225, practical: 225 }
    },
    {
        title: "AI – DevOps Engineer",
        code: "2020/ITES/ITSSC/04324",
        qp_code: "2020/ITES/ITSSC/04324",
        nos_code: "SSC/N9006",
        job_role: "DevOps Engineer",
        description: "Individuals at this job are responsible for managing production systems, developing tools and processes for continuous integration and delivery of applications.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 480,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics",
        skill_text: "CI/CD, Docker, Kubernetes, Cloud infrastructure, Automation, Monitoring",
        keywords: ["devops", "ci/cd", "docker", "kubernetes", "automation"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2020-01-01"),
        valid_till: new Date("2028-12-31"),
        proposed_occupation: "Artificial Intelligence and Big Data Analytics",
        progression_pathways: "Senior DevOps Engineer, Site Reliability Engineer",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 240, practical: 240 }
    },
    {
        title: "AI – Machine Learning Engineer",
        code: "2020/ITES/ITSSC/04323",
        qp_code: "2020/ITES/ITSSC/04323",
        nos_code: "SSC/N9007",
        job_role: "Machine Learning Engineer",
        description: "Individuals at this job are responsible for developing applications and platforms in AI & Big Data Analytics, evaluating technical performance of algorithmic models.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 480,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Artificial Intelligence and Big Data Analytics",
        skill_text: "Machine learning algorithms, Model deployment, TensorFlow, PyTorch, MLOps",
        keywords: ["machine learning", "ml", "tensorflow", "pytorch", "mlops"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2020-01-01"),
        valid_till: new Date("2028-12-31"),
        proposed_occupation: "Artificial Intelligence and Big Data Analytics",
        progression_pathways: "Senior ML Engineer, ML Architect",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 240, practical: 240 }
    },
    // Agriculture Sector
    {
        title: "Krishi Sahayak",
        code: "2022/AGR/ASCI/06446",
        qp_code: "2022/AGR/ASCI/06446",
        nos_code: "AGR/N0601",
        job_role: "Krishi Sahayak",
        description: "A Krishi Sahayak is responsible for creating awareness and building capacity of farmer/rural household members on agricultural activities and facilitates marketing of agricultural produce.",
        sector: "Agriculture",
        level: 3,
        maxHours: 300,
        minHours: 300,
        awardingBody: "Agriculture Skill Council of India (ASCI)",
        certifyingBody: "Agriculture Skill Council of India (ASCI)",
        occupation: "Agri-Information Management",
        skill_text: "Crop management, Farmer training, Market linkage, Agricultural practices, Extension services",
        keywords: ["agriculture", "krishi", "farming", "crop management", "extension"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2022-01-01"),
        valid_till: new Date("2030-12-31"),
        proposed_occupation: "Agri-Information Management",
        progression_pathways: "Senior Agriculture Extension Officer, Farm Manager",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 150, practical: 150 }
    },
    {
        title: "Vriksh Sanrakshak",
        code: "QG-04-AG-00092-2023-V1-ASCI",
        qp_code: "QG-04-AG-00092-2023-V1-ASCI",
        nos_code: "AGR/N0092",
        job_role: "Vriksh Sanrakshak",
        description: "A Vriksh Sanrakshak is responsible for planting, maintaining, and removing trees, woody plants and shrubs. Involves pruning and managing pest/disease control.",
        sector: "Agriculture",
        level: 4,
        maxHours: 390,
        minHours: 390,
        awardingBody: "Agriculture Skill Council of India (ASCI)",
        certifyingBody: "Agriculture Skill Council of India (ASCI)",
        occupation: "Agro-Forestry Management",
        skill_text: "Tree planting, Pruning, Pest management, Tree maintenance, Agroforestry",
        keywords: ["forestry", "tree management", "pruning", "agroforestry", "plant care"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Agro-Forestry Management",
        progression_pathways: "Forestry Supervisor, Agroforestry Manager",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 195, practical: 195 }
    },
    {
        title: "Agri Technician",
        code: "QG-04-AG-00093-2023-V1-ASCI",
        qp_code: "QG-04-AG-00093-2023-V1-ASCI",
        nos_code: "AGR/N0093",
        job_role: "Agri Technician",
        description: "An Agri Technician is responsible for operating and maintaining agricultural machinery and equipment for farming operations.",
        sector: "Agriculture",
        level: 4,
        maxHours: 420,
        minHours: 400,
        awardingBody: "Agriculture Skill Council of India (ASCI)",
        certifyingBody: "Agriculture Skill Council of India (ASCI)",
        occupation: "Agricultural Machinery Operation",
        skill_text: "Machinery operation, Equipment maintenance, Tractor operation, Farm equipment, Repair",
        keywords: ["agri machinery", "tractor", "equipment operation", "farm machinery", "maintenance"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Agricultural Machinery Operation",
        progression_pathways: "Senior Machinery Operator, Farm Equipment Manager",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 210, practical: 210 }
    },
    {
        title: "Organic Farming Specialist",
        code: "QG-05-AG-00094-2023-V1-ASCI",
        qp_code: "QG-05-AG-00094-2023-V1-ASCI",
        nos_code: "AGR/N0094",
        job_role: "Organic Farming Specialist",
        description: "An Organic Farming Specialist is responsible for implementing organic farming practices, soil health management, and sustainable agriculture methods.",
        sector: "Agriculture",
        level: 5,
        maxHours: 500,
        minHours: 450,
        awardingBody: "Agriculture Skill Council of India (ASCI)",
        certifyingBody: "Agriculture Skill Council of India (ASCI)",
        occupation: "Organic Farming",
        skill_text: "Organic farming, Soil management, Sustainable agriculture, Composting, Organic certification",
        keywords: ["organic farming", "sustainable agriculture", "soil health", "composting", "organic"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Organic Farming",
        progression_pathways: "Organic Farm Manager, Agriculture Consultant",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 250, practical: 250 }
    },
    // Handicrafts & Carpets Sector
    {
        title: "Block Printing Artisan",
        code: "QG-04-HC-00150-2023-V1-HCSC",
        qp_code: "QG-04-HC-00150-2023-V1-HCSC",
        nos_code: "HC/N0150",
        job_role: "Block Printing Artisan",
        description: "A Block Printing Artisan is skilled in traditional block printing techniques, fabric preparation, and color mixing for creating handcrafted textiles.",
        sector: "Handicrafts & Carpets",
        level: 4,
        maxHours: 350,
        minHours: 320,
        awardingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        certifyingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        occupation: "Textile Printing",
        skill_text: "Block printing, Fabric preparation, Color mixing, Traditional printing, Textile design",
        keywords: ["block printing", "textile", "handicraft", "printing", "fabric design"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Textile Printing",
        progression_pathways: "Master Artisan, Textile Designer",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 175, practical: 175 }
    },
    {
        title: "Carpet Weaver",
        code: "QG-04-HC-00151-2023-V1-HCSC",
        qp_code: "QG-04-HC-00151-2023-V1-HCSC",
        nos_code: "HC/N0151",
        job_role: "Carpet Weaver",
        description: "A Carpet Weaver is responsible for hand-weaving traditional carpets using various techniques, pattern creation, and quality finishing.",
        sector: "Handicrafts & Carpets",
        level: 4,
        maxHours: 600,
        minHours: 550,
        awardingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        certifyingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        occupation: "Carpet Manufacturing",
        skill_text: "Carpet weaving, Pattern design, Hand loom, Traditional weaving, Quality finishing",
        keywords: ["carpet weaving", "handicraft", "weaving", "loom", "pattern design"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Carpet Manufacturing",
        progression_pathways: "Master Weaver, Production Supervisor",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 300, practical: 300 }
    },
    {
        title: "Pottery Craftsman",
        code: "QG-03-HC-00152-2023-V1-HCSC",
        qp_code: "QG-03-HC-00152-2023-V1-HCSC",
        nos_code: "HC/N0152",
        job_role: "Pottery Craftsman",
        description: "A Pottery Craftsman is skilled in traditional pottery making including wheel throwing, hand building, glazing, and firing techniques.",
        sector: "Handicrafts & Carpets",
        level: 3,
        maxHours: 280,
        minHours: 250,
        awardingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        certifyingBody: "Handicrafts & Carpet Sector Skill Council (HCSSC)",
        occupation: "Pottery and Ceramics",
        skill_text: "Pottery making, Wheel throwing, Glazing, Firing, Hand building, Ceramics",
        keywords: ["pottery", "ceramics", "clay work", "wheel throwing", "handicraft"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Pottery and Ceramics",
        progression_pathways: "Master Potter, Ceramics Designer",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 140, practical: 140 }
    },
    // Wood & Carpentry Sector
    {
        title: "Master Carpenter",
        code: "QG-05-WC-00830-2023-V2-FFSC",
        qp_code: "QG-05-WC-00830-2023-V2-FFSC",
        nos_code: "FFS/N0830",
        job_role: "Master Carpenter",
        description: "The Master Carpenter plays the primary role of project supervision at the worksite, assisting in client coordination and vendor management of materials.",
        sector: "Wood & Carpentry",
        level: 5,
        maxHours: 720,
        minHours: 720,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Installation & After Sales",
        skill_text: "Carpentry, Project supervision, Client coordination, Material management, Installation",
        keywords: ["carpentry", "furniture", "installation", "woodwork", "supervision"],
        source_type: "NQR",
        version: "2.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Furniture Installation & After Sales",
        progression_pathways: "Project Manager, Furniture Business Owner",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 360, practical: 360 }
    },
    {
        title: "Multipurpose Assistant- Furniture Business Development",
        code: "QG-03-WC-00822-2023-V1-FFSC",
        qp_code: "QG-03-WC-00822-2023-V1-FFSC",
        nos_code: "FFS/N0822",
        job_role: "Multipurpose Assistant- Furniture Business Development",
        description: "Multipurpose Assistant provides support in various business development activities including market research, client communication, and sales distribution.",
        sector: "Wood & Carpentry",
        level: 3,
        maxHours: 540,
        minHours: 390,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Business Development & Distribution",
        skill_text: "Business development, Market research, Client communication, Sales, Distribution",
        keywords: ["furniture", "business development", "sales", "marketing", "distribution"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Furniture Business Development & Distribution",
        progression_pathways: "Business Development Executive, Sales Manager",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 270, practical: 270 }
    },
    {
        title: "Multipurpose Assistant- Furniture Production & Installation",
        code: "QG-03-WC-00819-2023-V1-FFSC",
        qp_code: "QG-03-WC-00819-2023-V1-FFSC",
        nos_code: "FFS/N0819",
        job_role: "Multipurpose Assistant- Furniture Production & Installation",
        description: "Multipurpose Assistant assists in interpreting work dockets, conducting work site recce, compiling lists of required materials, tools, and equipment.",
        sector: "Wood & Carpentry",
        level: 3,
        maxHours: 630,
        minHours: 420,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Production (Workshop)",
        skill_text: "Furniture production, Installation, Site survey, Material planning, Workshop operations",
        keywords: ["furniture", "production", "installation", "workshop", "carpentry"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Furniture Production (Workshop)",
        progression_pathways: "Production Supervisor, Workshop Manager",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 315, practical: 315 }
    },
    {
        title: "Multipurpose Draughtsperson (Design and Build)",
        code: "QG-03-WC-00818-2023-V1-FFSC",
        qp_code: "QG-03-WC-00818-2023-V1-FFSC",
        nos_code: "FFS/N0818",
        job_role: "Multipurpose Draughtsperson (Design and Build)",
        description: "Multipurpose Draughtsperson is responsible for assisting in converting designs into 2D/3D drawings and performing site surveys and measurements.",
        sector: "Wood & Carpentry",
        level: 3,
        maxHours: 540,
        minHours: 390,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Interior Designing",
        skill_text: "CAD drawing, 2D/3D design, Site survey, Measurements, Design software",
        keywords: ["cad", "design", "drafting", "interior design", "3d modeling"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Interior Designing",
        progression_pathways: "CAD Designer, Interior Designer",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 270, practical: 270 }
    },
    {
        title: "Panelworks Machine Operator",
        code: "QG-4.5-WC-00821-2023-V1-FFSC",
        qp_code: "QG-4.5-WC-00821-2023-V1-FFSC",
        nos_code: "FFS/N0821",
        job_role: "Panelworks Machine Operator",
        description: "The Panelworks Machine Operator operates and monitors machinery used in the production of panels for various applications.",
        sector: "Wood & Carpentry",
        level: 4,
        maxHours: 720,
        minHours: 570,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Production (Machine Shop)",
        skill_text: "Machine operation, Panel production, CNC operation, Quality control, Safety procedures",
        keywords: ["machine operation", "panel production", "cnc", "woodworking machines", "manufacturing"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2023-01-01"),
        valid_till: new Date("2031-12-31"),
        proposed_occupation: "Furniture Production (Machine Shop)",
        progression_pathways: "Machine Supervisor, Production Manager",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 360, practical: 360 }
    },
    {
        title: "Carpenter (WorldSkills)",
        code: "QG-4.5-WC-01791-2024-V1-FFSC",
        qp_code: "QG-4.5-WC-01791-2024-V1-FFSC",
        nos_code: "FFS/N1791",
        job_role: "Carpenter (WorldSkills)",
        description: "The WorldSkills-Certified Carpenter conducts on-site surveys, interprets blueprints, and prepares worksites with precision using hand tools and machines.",
        sector: "Wood & Carpentry",
        level: 4,
        maxHours: 510,
        minHours: 510,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Installation and After Sales",
        skill_text: "Carpentry, Blueprint reading, Precision work, Hand tools, Power tools, Installation",
        keywords: ["carpentry", "worldskills", "installation", "woodwork", "blueprint reading"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2024-01-01"),
        valid_till: new Date("2032-12-31"),
        proposed_occupation: "Furniture Installation and After Sales",
        progression_pathways: "Master Carpenter, Carpentry Trainer",
        qualification_type: "Qualification Pack",
        adopted_qualification: "WorldSkills Standards",
        training_delivery_hours: { theory: 255, practical: 255 }
    },
    {
        title: "Joiner (WorldSkills)",
        code: "QG-4.5-WC-01790-2024-V1-FFSC",
        qp_code: "QG-4.5-WC-01790-2024-V1-FFSC",
        nos_code: "FFS/N1790",
        job_role: "Joiner (WorldSkills)",
        description: "The WorldSkills-Certified Joiner conducts thorough site surveys, interprets complex blueprints, and showcases unmatched craftsmanship through precise work.",
        sector: "Wood & Carpentry",
        level: 4,
        maxHours: 510,
        minHours: 510,
        awardingBody: "Furniture & Fittings Skill Council (FFSC)",
        certifyingBody: "Furniture and Fittings Sector Skill Council",
        occupation: "Furniture Production (Work Shop)",
        skill_text: "Joinery, Precision woodwork, Blueprint interpretation, Hand joinery, Machine joinery, Craftsmanship",
        keywords: ["joinery", "worldskills", "woodwork", "craftsmanship", "furniture making"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2024-01-01"),
        valid_till: new Date("2032-12-31"),
        proposed_occupation: "Furniture Production (Work Shop)",
        progression_pathways: "Master Joiner, Furniture Design Specialist",
        qualification_type: "Qualification Pack",
        adopted_qualification: "WorldSkills Standards",
        training_delivery_hours: { theory: 255, practical: 255 }
    },
    // Additional IT-ITeS
    {
        title: "Full Stack Web Developer",
        code: "2021/ITES/ITSSC/05001",
        qp_code: "2021/ITES/ITSSC/05001",
        nos_code: "SSC/N5001",
        job_role: "Full Stack Web Developer",
        description: "Individuals at this job are responsible for developing both front-end and back-end components of web applications using modern frameworks and technologies.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 520,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Software Development",
        skill_text: "JavaScript, React, Node.js, Database design, API development, Full stack development",
        keywords: ["web development", "full stack", "javascript", "react", "node.js"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2021-01-01"),
        valid_till: new Date("2029-12-31"),
        proposed_occupation: "Software Development",
        progression_pathways: "Senior Full Stack Developer, Tech Lead, Solution Architect",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 260, practical: 260 }
    },
    {
        title: "Cloud Computing Associate",
        code: "2021/ITES/ITSSC/05002",
        qp_code: "2021/ITES/ITSSC/05002",
        nos_code: "SSC/N5002",
        job_role: "Cloud Computing Associate",
        description: "Individuals at this job are responsible for deploying, managing, and monitoring cloud infrastructure services across major cloud platforms.",
        sector: "IT-ITeS",
        level: 4,
        maxHours: 400,
        minHours: 380,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Cloud Computing",
        skill_text: "AWS, Azure, GCP, Cloud architecture, Infrastructure management, Cloud services",
        keywords: ["cloud computing", "aws", "azure", "gcp", "cloud infrastructure"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2021-01-01"),
        valid_till: new Date("2029-12-31"),
        proposed_occupation: "Cloud Computing",
        progression_pathways: "Cloud Engineer, Cloud Architect",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 200, practical: 200 }
    },
    {
        title: "Cybersecurity Analyst",
        code: "2021/ITES/ITSSC/05003",
        qp_code: "2021/ITES/ITSSC/05003",
        nos_code: "SSC/N5003",
        job_role: "Cybersecurity Analyst",
        description: "Individuals at this job are responsible for monitoring security systems, identifying vulnerabilities, and implementing security measures to protect organizational data.",
        sector: "IT-ITeS",
        level: 5,
        maxHours: 500,
        minHours: 480,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Information Security",
        skill_text: "Security monitoring, Vulnerability assessment, Penetration testing, Security tools, Incident response",
        keywords: ["cybersecurity", "security", "penetration testing", "vulnerability", "infosec"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2021-01-01"),
        valid_till: new Date("2029-12-31"),
        proposed_occupation: "Information Security",
        progression_pathways: "Senior Security Analyst, Security Architect, CISO",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 250, practical: 250 }
    },
    {
        title: "UI/UX Designer",
        code: "2021/ITES/ITSSC/05004",
        qp_code: "2021/ITES/ITSSC/05004",
        nos_code: "SSC/N5004",
        job_role: "UI/UX Designer",
        description: "Individuals at this job are responsible for designing user interfaces and user experiences for digital products using design thinking principles.",
        sector: "IT-ITeS",
        level: 4,
        maxHours: 360,
        minHours: 340,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Digital Design",
        skill_text: "UI design, UX research, Figma, Adobe XD, User testing, Wireframing, Prototyping",
        keywords: ["ui/ux", "design", "user experience", "figma", "prototyping"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2021-01-01"),
        valid_till: new Date("2029-12-31"),
        proposed_occupation: "Digital Design",
        progression_pathways: "Lead Designer, Design Manager, Product Designer",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 180, practical: 180 }
    },
    {
        title: "Quality Assurance Engineer",
        code: "2021/ITES/ITSSC/05005",
        qp_code: "2021/ITES/ITSSC/05005",
        nos_code: "SSC/N5005",
        job_role: "Quality Assurance Engineer",
        description: "Individuals at this job are responsible for testing software applications, creating test cases, and ensuring product quality through automated and manual testing.",
        sector: "IT-ITeS",
        level: 4,
        maxHours: 380,
        minHours: 360,
        awardingBody: "IT-ITeS Sector Skills Council NASSCOM (SSC NASSCOM)",
        certifyingBody: "IT-ITeS SSC NASSCOM",
        occupation: "Software Testing",
        skill_text: "Test automation, Selenium, Manual testing, Test case design, Quality assurance, Bug tracking",
        keywords: ["qa", "testing", "automation", "selenium", "quality assurance"],
        source_type: "NQR",
        version: "1.0",
        originally_approved: new Date("2021-01-01"),
        valid_till: new Date("2029-12-31"),
        proposed_occupation: "Software Testing",
        progression_pathways: "Senior QA Engineer, QA Lead, Test Architect",
        qualification_type: "Qualification Pack",
        adopted_qualification: null,
        training_delivery_hours: { theory: 190, practical: 190 }
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
    const now = new Date();
    // 24 hours ago check for "first fetch" condition
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const isFirstFetch = since < oneDayAgo;

    // Generate new credential if needed (throttled)
    const lastFetch = lastFetchTime[provider];
    if (!lastFetch || (now.getTime() - lastFetch.getTime() > 10000)) {
        // Only generate if we are NOT in the middle of pagination for a first fetch
        // (Though here we are simplifying to 1 item so pagination implies no more)
        const newCred = generateDynamicCredential(provider);
        allCredentials = allCredentials || generateCredentials();
        allCredentials.unshift(newCred);
        console.log(`Generated new dynamic credential for ${provider}`);
    }
    lastFetchTime[provider] = now;

    // Filter relevant credentials
    const providerCreds = getCredentialsByProvider(provider)
        .filter(c => c.issued_at > since);

    let finalCredentials = providerCreds;

    // All providers are now active - each returns 1 credential per sync
    if (isFirstFetch) {
        console.log(`Initial fetch request for ${provider} (since ${since.toISOString()}). Limiting to 1.`);
        finalCredentials = providerCreds.slice(0, 1);
    } else {
        // For frequent polls, return 1 new credential
        console.log(`Incremental fetch for ${provider} (since ${since.toISOString()}). Found ${providerCreds.length}.`);
        finalCredentials = providerCreds.slice(0, 1);
    }

    // Apply pagination
    const paginated = finalCredentials.slice(offset, offset + limit);
    const total = finalCredentials.length;
    const hasMore = offset + limit < total;

    return { credentials: paginated, total, hasMore };
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


-- CreateTable
CREATE TABLE "SkillKnowledgeBase" (
    "id" SERIAL NOT NULL,
    "qp_code" TEXT,
    "nos_code" TEXT,
    "job_role" TEXT,
    "nsqf_level" INTEGER,
    "sector" TEXT,
    "title" TEXT,
    "description" TEXT,
    "skill_text" TEXT,
    "keywords" TEXT[],
    "source_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillKnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillKnowledgeBase_qp_code_idx" ON "SkillKnowledgeBase"("qp_code");

-- CreateIndex
CREATE INDEX "SkillKnowledgeBase_nos_code_idx" ON "SkillKnowledgeBase"("nos_code");

-- CreateIndex
CREATE INDEX "SkillKnowledgeBase_nsqf_level_idx" ON "SkillKnowledgeBase"("nsqf_level");

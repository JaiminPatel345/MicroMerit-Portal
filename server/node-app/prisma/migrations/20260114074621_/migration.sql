-- AlterTable
ALTER TABLE "SkillKnowledgeBase" ADD COLUMN     "adopted_qualification" TEXT,
ADD COLUMN     "awarding_body" TEXT,
ADD COLUMN     "certifying_body" TEXT,
ADD COLUMN     "max_notional_hours" TEXT,
ADD COLUMN     "min_notional_hours" TEXT,
ADD COLUMN     "originally_approved" TIMESTAMP(3),
ADD COLUMN     "progression_pathways" TEXT,
ADD COLUMN     "proposed_occupation" TEXT,
ADD COLUMN     "qualification_type" TEXT,
ADD COLUMN     "training_delivery_hours" JSONB,
ADD COLUMN     "valid_till" TIMESTAMP(3),
ADD COLUMN     "version" TEXT;

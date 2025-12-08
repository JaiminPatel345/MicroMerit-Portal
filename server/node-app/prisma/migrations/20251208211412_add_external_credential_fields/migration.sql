-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "awarding_bodies" JSONB,
ADD COLUMN     "certificate_code" TEXT,
ADD COLUMN     "max_hr" INTEGER,
ADD COLUMN     "min_hr" INTEGER,
ADD COLUMN     "nsqf_level" INTEGER,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "tags" JSONB;

-- CreateIndex
CREATE INDEX "Credential_certificate_code_idx" ON "Credential"("certificate_code");

-- CreateIndex
CREATE INDEX "Credential_sector_idx" ON "Credential"("sector");

-- CreateIndex
CREATE INDEX "Credential_nsqf_level_idx" ON "Credential"("nsqf_level");

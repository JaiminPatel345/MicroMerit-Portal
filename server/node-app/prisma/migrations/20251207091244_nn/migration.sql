-- AlterTable
ALTER TABLE "verification_session" ADD COLUMN     "employer_id" INTEGER;

-- CreateIndex
CREATE INDEX "verification_session_employer_id_idx" ON "verification_session"("employer_id");

/*
  Warnings:

  - You are about to drop the `ExternalCredential` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExternalCredential" DROP CONSTRAINT "ExternalCredential_issuer_id_fkey";

-- DropForeignKey
ALTER TABLE "ExternalCredential" DROP CONSTRAINT "ExternalCredential_learner_id_fkey";

-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "encrypted_raw_payload" TEXT,
ADD COLUMN     "is_external" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "match_confidence" DOUBLE PRECISION,
ADD COLUMN     "match_type" TEXT,
ADD COLUMN     "processed_at" TIMESTAMP(3),
ADD COLUMN     "provider_credential_id" TEXT,
ADD COLUMN     "signature_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_method" TEXT;

-- DropTable
DROP TABLE "ExternalCredential";

-- CreateIndex
CREATE INDEX "Credential_is_external_idx" ON "Credential"("is_external");

-- CreateIndex
CREATE INDEX "Credential_provider_credential_id_idx" ON "Credential"("provider_credential_id");

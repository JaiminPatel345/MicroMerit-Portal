-- AlterTable
ALTER TABLE "issuer" ADD COLUMN     "accept_external" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_sync_at" TIMESTAMP(3),
ADD COLUMN     "registry_id" TEXT,
ADD COLUMN     "reissue_local_vc" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "IssuerPublicKeys" (
    "id" SERIAL NOT NULL,
    "issuer_id" INTEGER NOT NULL,
    "jwk_set_url" TEXT NOT NULL,
    "cached_jwks" JSONB NOT NULL,
    "last_fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssuerPublicKeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCredential" (
    "id" TEXT NOT NULL,
    "issuer_id" INTEGER NOT NULL,
    "provider_credential_id" TEXT NOT NULL,
    "canonical_payload" JSONB NOT NULL,
    "raw_payload_encrypted" BYTEA,
    "signature_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "learner_id" INTEGER,
    "match_confidence" DOUBLE PRECISION,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedJob" (
    "idempotency_key" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedJob_pkey" PRIMARY KEY ("idempotency_key")
);

-- CreateTable
CREATE TABLE "DLQ" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DLQ_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssuerPublicKeys_issuer_id_idx" ON "IssuerPublicKeys"("issuer_id");

-- CreateIndex
CREATE UNIQUE INDEX "IssuerPublicKeys_issuer_id_jwk_set_url_key" ON "IssuerPublicKeys"("issuer_id", "jwk_set_url");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalCredential_provider_credential_id_key" ON "ExternalCredential"("provider_credential_id");

-- CreateIndex
CREATE INDEX "ExternalCredential_issuer_id_idx" ON "ExternalCredential"("issuer_id");

-- CreateIndex
CREATE INDEX "ExternalCredential_status_idx" ON "ExternalCredential"("status");

-- CreateIndex
CREATE INDEX "ExternalCredential_learner_id_idx" ON "ExternalCredential"("learner_id");

-- CreateIndex
CREATE INDEX "ProcessedJob_processed_at_idx" ON "ProcessedJob"("processed_at");

-- CreateIndex
CREATE INDEX "DLQ_job_type_idx" ON "DLQ"("job_type");

-- CreateIndex
CREATE INDEX "DLQ_created_at_idx" ON "DLQ"("created_at");

-- CreateIndex
CREATE INDEX "issuer_registry_id_idx" ON "issuer"("registry_id");

-- AddForeignKey
ALTER TABLE "IssuerPublicKeys" ADD CONSTRAINT "IssuerPublicKeys_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCredential" ADD CONSTRAINT "ExternalCredential_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCredential" ADD CONSTRAINT "ExternalCredential_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

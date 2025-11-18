-- CreateTable
CREATE TABLE "credential" (
    "id" SERIAL NOT NULL,
    "issuer_id" INTEGER NOT NULL,
    "learner_id" INTEGER,
    "credential_uid" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed_at" TIMESTAMP(3),

    CONSTRAINT "credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_record" (
    "id" SERIAL NOT NULL,
    "credential_id" INTEGER NOT NULL,
    "blockchain_tx_id" TEXT NOT NULL,
    "hash_value" TEXT NOT NULL,
    "stored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_certificate" (
    "id" SERIAL NOT NULL,
    "credential_id" INTEGER NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "qr_code_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdf_certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credential_credential_uid_key" ON "credential"("credential_uid");

-- CreateIndex
CREATE INDEX "credential_issuer_id_idx" ON "credential"("issuer_id");

-- CreateIndex
CREATE INDEX "credential_learner_id_idx" ON "credential"("learner_id");

-- CreateIndex
CREATE INDEX "credential_credential_uid_idx" ON "credential"("credential_uid");

-- CreateIndex
CREATE INDEX "credential_status_idx" ON "credential"("status");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_record_credential_id_key" ON "blockchain_record"("credential_id");

-- CreateIndex
CREATE INDEX "blockchain_record_blockchain_tx_id_idx" ON "blockchain_record"("blockchain_tx_id");

-- CreateIndex
CREATE UNIQUE INDEX "pdf_certificate_credential_id_key" ON "pdf_certificate"("credential_id");

-- AddForeignKey
ALTER TABLE "credential" ADD CONSTRAINT "credential_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential" ADD CONSTRAINT "credential_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_record" ADD CONSTRAINT "blockchain_record_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_certificate" ADD CONSTRAINT "pdf_certificate_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

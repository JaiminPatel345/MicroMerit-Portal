-- CreateTable
CREATE TABLE "issuer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "official_domain" TEXT,
    "website_url" TEXT,
    "type" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "contact_person_name" TEXT,
    "contact_person_designation" TEXT,
    "address" TEXT,
    "kyc_document_url" TEXT,
    "logo_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issuer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issuer_api_key" (
    "id" SERIAL NOT NULL,
    "issuer_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
    "allowed_ips" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issuer_api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "hashed_password" TEXT,
    "profileFolder" TEXT,
    "profileUrl" TEXT,
    "external_digilocker_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "other_emails" TEXT[],
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_session" (
    "id" TEXT NOT NULL,
    "session_type" TEXT NOT NULL,
    "learner_id" INTEGER,
    "issuer_id" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "contact_type" TEXT,
    "otp_hash" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "metadata" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "learner_id" INTEGER,
    "learner_email" TEXT NOT NULL,
    "issuer_id" INTEGER NOT NULL,
    "certificate_title" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "ipfs_cid" TEXT,
    "pdf_url" TEXT,
    "tx_hash" TEXT,
    "data_hash" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "issuer_email_key" ON "issuer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "issuer_api_key_api_key_key" ON "issuer_api_key"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "learner_email_key" ON "learner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "learner_phone_key" ON "learner"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE INDEX "verification_session_session_type_idx" ON "verification_session"("session_type");

-- CreateIndex
CREATE INDEX "verification_session_learner_id_idx" ON "verification_session"("learner_id");

-- CreateIndex
CREATE INDEX "verification_session_issuer_id_idx" ON "verification_session"("issuer_id");

-- CreateIndex
CREATE INDEX "verification_session_email_idx" ON "verification_session"("email");

-- CreateIndex
CREATE INDEX "verification_session_phone_idx" ON "verification_session"("phone");

-- CreateIndex
CREATE INDEX "verification_session_expires_at_idx" ON "verification_session"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_credential_id_key" ON "Credential"("credential_id");

-- CreateIndex
CREATE INDEX "Credential_credential_id_idx" ON "Credential"("credential_id");

-- CreateIndex
CREATE INDEX "Credential_issuer_id_idx" ON "Credential"("issuer_id");

-- CreateIndex
CREATE INDEX "Credential_learner_id_idx" ON "Credential"("learner_id");

-- CreateIndex
CREATE INDEX "Credential_learner_email_idx" ON "Credential"("learner_email");

-- CreateIndex
CREATE INDEX "Credential_ipfs_cid_idx" ON "Credential"("ipfs_cid");

-- CreateIndex
CREATE INDEX "Credential_tx_hash_idx" ON "Credential"("tx_hash");

-- CreateIndex
CREATE INDEX "Credential_status_idx" ON "Credential"("status");

-- CreateIndex
CREATE INDEX "Credential_metadata_idx" ON "Credential" USING GIN ("metadata" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "Credential_certificate_title_idx" ON "Credential"("certificate_title");

-- AddForeignKey
ALTER TABLE "issuer_api_key" ADD CONSTRAINT "issuer_api_key_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
    "email" TEXT,
    "phone" TEXT,
    "hashed_password" TEXT,
    "profileFolder" TEXT,
    "profileUrl" TEXT,
    "external_digilocker_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "other_emails" TEXT[],
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

-- AddForeignKey
ALTER TABLE "issuer_api_key" ADD CONSTRAINT "issuer_api_key_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

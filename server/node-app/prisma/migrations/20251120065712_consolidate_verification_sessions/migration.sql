/*
  Warnings:

  - You are about to drop the `email_verification_session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `issuer_registration_session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `primary_contact_verification_session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `registration_session` table. If the table is not empty, all the data it contains will be lost.

*/

-- CreateTable first
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

-- Migrate data from registration_session
INSERT INTO "verification_session" (
    "id", "session_type", "email", "phone", "otp_hash", 
    "is_verified", "verified_at", "expires_at", "created_at", "metadata"
)
SELECT 
    "id", 
    'learner_registration' as "session_type",
    "email", 
    "phone", 
    "otp_hash", 
    "is_verified", 
    "verified_at", 
    "expires_at", 
    "created_at",
    jsonb_build_object('verification_method', "verification_method") as "metadata"
FROM "registration_session";

-- Migrate data from email_verification_session
INSERT INTO "verification_session" (
    "id", "session_type", "learner_id", "email", "otp_hash", 
    "is_verified", "verified_at", "expires_at", "created_at"
)
SELECT 
    "id", 
    'email_verification' as "session_type",
    "learner_id",
    "email", 
    "otp_hash", 
    "is_verified", 
    "verified_at", 
    "expires_at", 
    "created_at"
FROM "email_verification_session";

-- Migrate data from issuer_registration_session
INSERT INTO "verification_session" (
    "id", "session_type", "email", "otp_hash", 
    "is_verified", "verified_at", "expires_at", "created_at", "metadata"
)
SELECT 
    "id", 
    'issuer_registration' as "session_type",
    "email", 
    "otp_hash", 
    "is_verified", 
    "verified_at", 
    "expires_at", 
    "created_at",
    "registration_data" as "metadata"
FROM "issuer_registration_session";

-- Migrate data from primary_contact_verification_session
INSERT INTO "verification_session" (
    "id", "session_type", "learner_id", "email", "phone", "contact_type",
    "otp_hash", "is_verified", "verified_at", "expires_at", "created_at"
)
SELECT 
    "id", 
    'primary_contact_change' as "session_type",
    "learner_id",
    CASE WHEN "contact_type" = 'email' THEN "contact_value" ELSE NULL END as "email",
    CASE WHEN "contact_type" = 'phone' THEN "contact_value" ELSE NULL END as "phone",
    "contact_type",
    "otp_hash", 
    "is_verified", 
    "verified_at", 
    "expires_at", 
    "created_at"
FROM "primary_contact_verification_session";

-- DropTable
DROP TABLE "email_verification_session";

-- DropTable
DROP TABLE "issuer_registration_session";

-- DropTable
DROP TABLE "primary_contact_verification_session";

-- DropTable
DROP TABLE "registration_session";

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

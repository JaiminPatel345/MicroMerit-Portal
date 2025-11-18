-- CreateTable
CREATE TABLE "primary_contact_verification_session" (
    "id" TEXT NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "contact_type" TEXT NOT NULL,
    "contact_value" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "primary_contact_verification_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "primary_contact_verification_session_learner_id_idx" ON "primary_contact_verification_session"("learner_id");

-- CreateIndex
CREATE INDEX "primary_contact_verification_session_expires_at_idx" ON "primary_contact_verification_session"("expires_at");

-- CreateTable
CREATE TABLE "email_verification_session" (
    "id" TEXT NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verification_session_learner_id_idx" ON "email_verification_session"("learner_id");

-- CreateIndex
CREATE INDEX "email_verification_session_email_idx" ON "email_verification_session"("email");

-- CreateIndex
CREATE INDEX "email_verification_session_expires_at_idx" ON "email_verification_session"("expires_at");

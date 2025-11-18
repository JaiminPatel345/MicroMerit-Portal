-- CreateTable
CREATE TABLE "issuer_registration_session" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "registration_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issuer_registration_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issuer_registration_session_email_idx" ON "issuer_registration_session"("email");

-- CreateIndex
CREATE INDEX "issuer_registration_session_expires_at_idx" ON "issuer_registration_session"("expires_at");

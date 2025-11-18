-- CreateTable
CREATE TABLE "registration_session" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "otp_hash" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_method" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registration_session_email_idx" ON "registration_session"("email");

-- CreateIndex
CREATE INDEX "registration_session_phone_idx" ON "registration_session"("phone");

-- CreateIndex
CREATE INDEX "registration_session_expires_at_idx" ON "registration_session"("expires_at");

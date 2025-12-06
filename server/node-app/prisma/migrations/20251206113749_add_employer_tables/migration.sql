-- CreateTable
CREATE TABLE "employer" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_website" TEXT,
    "company_address" TEXT,
    "industry_type" TEXT,
    "company_size" TEXT,
    "contact_person" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "company_doc_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_activity_log" (
    "id" SERIAL NOT NULL,
    "employer_id" INTEGER NOT NULL,
    "credential_id" TEXT,
    "activity_type" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employer_email_key" ON "employer"("email");

-- AddForeignKey
ALTER TABLE "employer_activity_log" ADD CONSTRAINT "employer_activity_log_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

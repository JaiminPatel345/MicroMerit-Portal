-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "batch_id" INTEGER,
ADD COLUMN     "blockchain_tx_hash" TEXT,
ADD COLUMN     "original_file_url" TEXT,
ADD COLUMN     "verified_pdf_url" TEXT;

-- CreateTable
CREATE TABLE "BulkUploadBatch" (
    "id" SERIAL NOT NULL,
    "issuer_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkUploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkUploadError" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "file_name" TEXT,
    "error_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkUploadError_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "BulkUploadBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkUploadBatch" ADD CONSTRAINT "BulkUploadBatch_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkUploadError" ADD CONSTRAINT "BulkUploadError_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "BulkUploadBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `company_doc_url` on the `employer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pan_number]` on the table `employer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "employer" DROP COLUMN "company_doc_url",
ADD COLUMN     "pan_number" TEXT,
ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateIndex
CREATE UNIQUE INDEX "employer_pan_number_key" ON "employer"("pan_number");

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN "estimateId" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedByUserId" TEXT,
ADD COLUMN "pdfS3Key" TEXT;

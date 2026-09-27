-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "defaultTaxPercent" TEXT NOT NULL DEFAULT '18';

-- AlterTable
ALTER TABLE "PriceCatalogItem" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'material';

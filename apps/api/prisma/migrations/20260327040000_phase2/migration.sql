-- CreateTable
CREATE TABLE "PriceCatalogItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" TEXT NOT NULL,
    "taxPercent" TEXT NOT NULL DEFAULT '18',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationResult" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "estimateId" TEXT,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceCatalogItem_organizationId_sku_key" ON "PriceCatalogItem"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "ValidationResult_projectId_createdAt_idx" ON "ValidationResult"("projectId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PriceCatalogItem" ADD CONSTRAINT "PriceCatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

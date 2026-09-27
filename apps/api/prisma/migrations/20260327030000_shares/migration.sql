-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "events" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Share_tokenHash_key" ON "Share"("tokenHash");

-- CreateIndex
CREATE INDEX "Share_proposalId_idx" ON "Share"("proposalId");

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

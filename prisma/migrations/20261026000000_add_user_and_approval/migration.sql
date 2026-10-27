-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Transaction" ADD COLUMN "proofPath" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "proofOriginalName" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "proofSize" INTEGER;
ALTER TABLE "Transaction" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Transaction" ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_createdById_idx" ON "Transaction"("createdById");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

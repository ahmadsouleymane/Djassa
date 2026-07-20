/*
  Warnings:

  - You are about to drop the column `sellerVerificationDocUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "sellerVerificationDocUrl",
ADD COLUMN     "sellerVerificationRectoUrl" TEXT,
ADD COLUMN     "sellerVerificationSelfieUrl" TEXT,
ADD COLUMN     "sellerVerificationVersoUrl" TEXT;

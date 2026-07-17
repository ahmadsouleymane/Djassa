/*
  Warnings:

  - Added the required column `checkoutRef` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_chatMessageId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "checkoutRef" TEXT NOT NULL,
ALTER COLUMN "chatMessageId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_checkoutRef_idx" ON "Order"("checkoutRef");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

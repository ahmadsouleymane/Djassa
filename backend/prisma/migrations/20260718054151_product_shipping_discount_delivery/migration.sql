-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deliveryInfo" TEXT,
ADD COLUMN     "discountPercent" INTEGER,
ADD COLUMN     "shippingFee" INTEGER NOT NULL DEFAULT 0;

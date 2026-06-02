-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('unfulfilled', 'processing', 'packed', 'shipped', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('none', 'pending', 'partial', 'completed', 'failed');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'pending_cod';
ALTER TYPE "PaymentStatus" ADD VALUE 'pending_bkash';
ALTER TYPE "PaymentStatus" ADD VALUE 'pending_nagad';
ALTER TYPE "PaymentStatus" ADD VALUE 'pending_rocket';
ALTER TYPE "PaymentStatus" ADD VALUE 'pending_card';

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "cartToken" TEXT NOT NULL,
    "couponCode" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "productSnapshot" JSONB NOT NULL,
    "pricingSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "profileId" TEXT,
ADD COLUMN     "cartId" TEXT,
ADD COLUMN     "couponSnapshot" JSONB,
ADD COLUMN     "pricingSnapshot" JSONB,
ADD COLUMN     "shippingSnapshot" JSONB,
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'unfulfilled',
ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "refundStatus" "RefundStatus" NOT NULL DEFAULT 'none',
ADD COLUMN     "refundSnapshot" JSONB,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_cartToken_key" ON "Cart"("cartToken");

-- CreateIndex
CREATE INDEX "Cart_profileId_idx" ON "Cart"("profileId");

-- CreateIndex
CREATE INDEX "Cart_cartToken_idx" ON "Cart"("cartToken");

-- CreateIndex
CREATE INDEX "Cart_expiresAt_idx" ON "Cart"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_key" ON "CartItem"("cartId", "productId", "variantId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- CreateIndex
CREATE INDEX "Order_profileId_idx" ON "Order"("profileId");

-- CreateIndex
CREATE INDEX "Order_fulfillmentStatus_idx" ON "Order"("fulfillmentStatus");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('admin', 'staff', 'user');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('category', 'subcategory', 'child');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video', 'view_360');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('feature', 'material', 'color', 'style', 'audience');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'bkash', 'nagad', 'rocket', 'card', 'bank_transfer');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed', 'buy_x_get_y', 'free_shipping');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('percentage', 'fixed', 'buy_x_get_y', 'free_product');

-- CreateEnum
CREATE TYPE "RecoveryStatus" AS ENUM ('pending', 'contacted', 'recovered', 'lost');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "isAdmin" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "parentId" TEXT,
    "fullSlug" TEXT,
    "categoryType" "CategoryType" NOT NULL,
    "imageUrl" TEXT,
    "featuredImageUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "TagType" NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "comparePrice" DECIMAL(10,2),
    "salePrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "shortDescription" TEXT,
    "shippingText" TEXT,
    "stockStatusText" TEXT,
    "categoryId" TEXT,
    "brandId" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "bestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
    "showOffers" BOOLEAN NOT NULL DEFAULT true,
    "showShippingInfo" BOOLEAN NOT NULL DEFAULT true,
    "showShippingText" BOOLEAN NOT NULL DEFAULT true,
    "showStockStatus" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "optionValues" JSONB NOT NULL,
    "imageUrl" TEXT,
    "gallery" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "type" "MediaType" NOT NULL DEFAULT 'image',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFaq" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTab" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "displayStyle" TEXT NOT NULL DEFAULT 'content',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOffer" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "offerType" "OfferType" NOT NULL,
    "displayText" TEXT NOT NULL,
    "buyQuantity" INTEGER,
    "getQuantity" INTEGER,
    "discountValue" DECIMAL(10,2),
    "minCartTotal" DECIMAL(10,2),
    "freeProductId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTag" (
    "productId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "customerCity" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "couponCode" TEXT,
    "paymentMethod" "PaymentMethod",
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'pending',
    "shippingAddress" JSONB NOT NULL,
    "deliveryPartner" TEXT,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(10,2),
    "minCartTotal" DECIMAL(10,2),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applyTo" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "targetIds" TEXT[],
    "bannerImage" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "amount" DECIMAL(10,2),
    "customerName" TEXT,
    "referenceId" TEXT,
    "url" TEXT,
    "adminSeen" BOOLEAN NOT NULL DEFAULT false,
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncompleteOrder" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customerName" TEXT,
    "email" TEXT,
    "address" JSONB NOT NULL,
    "cartItems" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "deliveryCharge" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "coupon" TEXT,
    "paymentMethod" TEXT,
    "checkoutStep" TEXT NOT NULL DEFAULT 'started',
    "recovered" BOOLEAN NOT NULL DEFAULT false,
    "recoveryStatus" "RecoveryStatus" NOT NULL DEFAULT 'pending',
    "convertedOrderId" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncompleteOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "buttonText" TEXT,
    "buttonLink" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedCategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT,
    "imageUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloatingIcon" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "iconUrl" TEXT,
    "iconColor" TEXT,
    "bgColor" TEXT NOT NULL,
    "presetKey" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloatingIcon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloatingIconsSettings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "animationStyle" TEXT,
    "animationIntensity" TEXT,
    "radarAnimation" BOOLEAN NOT NULL DEFAULT false,
    "expandIconUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloatingIconsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterSettings" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "copyrightText" TEXT NOT NULL,
    "socialLinks" JSONB NOT NULL,
    "quickLinks" JSONB NOT NULL,
    "customerCareLinks" JSONB NOT NULL,
    "newsletterEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignSettings" (
    "id" TEXT NOT NULL,
    "logoDesktopUrl" TEXT,
    "logoMobileUrl" TEXT,
    "logoFooterUrl" TEXT,
    "faviconUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementBar" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "bgColor" TEXT NOT NULL,
    "dismissible" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnouncementBar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeFaq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhyChooseUsCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhyChooseUsCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "review" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "mainImageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoTestimonial" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "autoplay" BOOLEAN NOT NULL DEFAULT false,
    "loop" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT true,
    "ctaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ctaText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutSection" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "defaultSorting" TEXT NOT NULL DEFAULT 'newest',
    "sortingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "searchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cardCtaMode" TEXT NOT NULL DEFAULT 'add_to_cart',
    "cardShowAddToCart" BOOLEAN NOT NULL DEFAULT true,
    "cardShowBuyNow" BOOLEAN NOT NULL DEFAULT false,
    "cardShowViewDetails" BOOLEAN NOT NULL DEFAULT true,
    "pdpShowShipmentDetails" BOOLEAN NOT NULL DEFAULT true,
    "pdpShowWhyChooseUs" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSettings" (
    "id" TEXT NOT NULL,
    "pageTitle" TEXT,
    "pageIntro" TEXT,
    "email" TEXT,
    "receivingEmail" TEXT,
    "phoneNumber" TEXT,
    "showAddress" BOOLEAN NOT NULL DEFAULT true,
    "businessAddress" TEXT,
    "phoneFieldEnabled" BOOLEAN NOT NULL DEFAULT true,
    "socialSectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "socialLinks" JSONB NOT NULL,
    "mapEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mapEmbed" TEXT,
    "faqShortcutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "faqShortcutItems" JSONB NOT NULL,
    "submitButtonText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappSettings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT NOT NULL,
    "radarAnimation" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingPixel" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "pixelId" TEXT NOT NULL,
    "accessToken" TEXT,
    "testEventCode" TEXT,
    "advancedMatching" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingPixel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneName" TEXT,
    "areas" JSONB NOT NULL,
    "deliveryCharge" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "freeDeliveryMinimum" DECIMAL(10,2),
    "freeShippingThreshold" DECIMAL(10,2),
    "estimatedDays" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSettings" (
    "id" TEXT NOT NULL,
    "storeName" TEXT,
    "storeAddress" TEXT,
    "storePhone" TEXT,
    "storeEmail" TEXT,
    "logoUrl" TEXT,
    "signatureLabel" TEXT,
    "termsText" TEXT,
    "footerText" TEXT,
    "footerNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectOrderChannel" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectOrderChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_email_idx" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_categoryType_idx" ON "Category"("categoryType");

-- CreateIndex
CREATE INDEX "Category_enabled_idx" ON "Category"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_slug_idx" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_enabled_idx" ON "Brand"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_slug_idx" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_type_idx" ON "Tag"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "Product_bestSeller_idx" ON "Product"("bestSeller");

-- CreateIndex
CREATE INDEX "Product_isNewArrival_idx" ON "Product"("isNewArrival");

-- CreateIndex
CREATE INDEX "Product_sortOrder_idx" ON "Product"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_active_idx" ON "ProductVariant"("active");

-- CreateIndex
CREATE INDEX "ProductMedia_productId_idx" ON "ProductMedia"("productId");

-- CreateIndex
CREATE INDEX "ProductMedia_variantId_idx" ON "ProductMedia"("variantId");

-- CreateIndex
CREATE INDEX "ProductMedia_type_idx" ON "ProductMedia"("type");

-- CreateIndex
CREATE INDEX "ProductFaq_productId_idx" ON "ProductFaq"("productId");

-- CreateIndex
CREATE INDEX "ProductTab_productId_idx" ON "ProductTab"("productId");

-- CreateIndex
CREATE INDEX "ProductOffer_productId_idx" ON "ProductOffer"("productId");

-- CreateIndex
CREATE INDEX "ProductOffer_enabled_idx" ON "ProductOffer"("enabled");

-- CreateIndex
CREATE INDEX "ProductTag_productId_idx" ON "ProductTag"("productId");

-- CreateIndex
CREATE INDEX "ProductTag_tagId_idx" ON "ProductTag"("tagId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_customerPhone_idx" ON "Order"("customerPhone");

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_enabled_idx" ON "Coupon"("enabled");

-- CreateIndex
CREATE INDEX "Coupon_startDate_idx" ON "Coupon"("startDate");

-- CreateIndex
CREATE INDEX "Coupon_endDate_idx" ON "Coupon"("endDate");

-- CreateIndex
CREATE INDEX "Offer_applyTo_idx" ON "Offer"("applyTo");

-- CreateIndex
CREATE INDEX "Offer_enabled_idx" ON "Offer"("enabled");

-- CreateIndex
CREATE INDEX "Offer_startDate_idx" ON "Offer"("startDate");

-- CreateIndex
CREATE INDEX "Offer_endDate_idx" ON "Offer"("endDate");

-- CreateIndex
CREATE INDEX "Review_productId_idx" ON "Review"("productId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "AdminNotification_type_idx" ON "AdminNotification"("type");

-- CreateIndex
CREATE INDEX "AdminNotification_adminSeen_idx" ON "AdminNotification"("adminSeen");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- CreateIndex
CREATE INDEX "IncompleteOrder_sessionId_idx" ON "IncompleteOrder"("sessionId");

-- CreateIndex
CREATE INDEX "IncompleteOrder_phone_idx" ON "IncompleteOrder"("phone");

-- CreateIndex
CREATE INDEX "IncompleteOrder_recovered_idx" ON "IncompleteOrder"("recovered");

-- CreateIndex
CREATE INDEX "IncompleteOrder_lastActivity_idx" ON "IncompleteOrder"("lastActivity");

-- CreateIndex
CREATE INDEX "HeroSlide_enabled_idx" ON "HeroSlide"("enabled");

-- CreateIndex
CREATE INDEX "HeroSlide_sortOrder_idx" ON "HeroSlide"("sortOrder");

-- CreateIndex
CREATE INDEX "FeaturedCategory_categoryId_idx" ON "FeaturedCategory"("categoryId");

-- CreateIndex
CREATE INDEX "FeaturedCategory_enabled_idx" ON "FeaturedCategory"("enabled");

-- CreateIndex
CREATE INDEX "FeaturedCategory_sortOrder_idx" ON "FeaturedCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "FloatingIcon_enabled_idx" ON "FloatingIcon"("enabled");

-- CreateIndex
CREATE INDEX "FloatingIcon_sortOrder_idx" ON "FloatingIcon"("sortOrder");

-- CreateIndex
CREATE INDEX "HomeFaq_sortOrder_idx" ON "HomeFaq"("sortOrder");

-- CreateIndex
CREATE INDEX "WhyChooseUsCard_sortOrder_idx" ON "WhyChooseUsCard"("sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_sortOrder_idx" ON "Testimonial"("sortOrder");

-- CreateIndex
CREATE INDEX "VideoTestimonial_productId_idx" ON "VideoTestimonial"("productId");

-- CreateIndex
CREATE INDEX "VideoTestimonial_enabled_idx" ON "VideoTestimonial"("enabled");

-- CreateIndex
CREATE INDEX "VideoTestimonial_featured_idx" ON "VideoTestimonial"("featured");

-- CreateIndex
CREATE INDEX "VideoTestimonial_sortOrder_idx" ON "VideoTestimonial"("sortOrder");

-- CreateIndex
CREATE INDEX "HomepageSection_enabled_idx" ON "HomepageSection"("enabled");

-- CreateIndex
CREATE INDEX "HomepageSection_sortOrder_idx" ON "HomepageSection"("sortOrder");

-- CreateIndex
CREATE INDEX "AboutSection_enabled_idx" ON "AboutSection"("enabled");

-- CreateIndex
CREATE INDEX "AboutSection_sortOrder_idx" ON "AboutSection"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_slug_key" ON "Policy"("slug");

-- CreateIndex
CREATE INDEX "Policy_slug_idx" ON "Policy"("slug");

-- CreateIndex
CREATE INDEX "Policy_enabled_idx" ON "Policy"("enabled");

-- CreateIndex
CREATE INDEX "Policy_sortOrder_idx" ON "Policy"("sortOrder");

-- CreateIndex
CREATE INDEX "TrackingPixel_platform_idx" ON "TrackingPixel"("platform");

-- CreateIndex
CREATE INDEX "TrackingPixel_enabled_idx" ON "TrackingPixel"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPartner_slug_key" ON "DeliveryPartner"("slug");

-- CreateIndex
CREATE INDEX "DeliveryPartner_slug_idx" ON "DeliveryPartner"("slug");

-- CreateIndex
CREATE INDEX "DeliveryPartner_enabled_idx" ON "DeliveryPartner"("enabled");

-- CreateIndex
CREATE INDEX "DeliveryZone_enabled_idx" ON "DeliveryZone"("enabled");

-- CreateIndex
CREATE INDEX "DeliveryZone_sortOrder_idx" ON "DeliveryZone"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DirectOrderChannel_identifier_key" ON "DirectOrderChannel"("identifier");

-- CreateIndex
CREATE INDEX "DirectOrderChannel_identifier_idx" ON "DirectOrderChannel"("identifier");

-- CreateIndex
CREATE INDEX "DirectOrderChannel_enabled_idx" ON "DirectOrderChannel"("enabled");

-- CreateIndex
CREATE INDEX "DirectOrderChannel_sortOrder_idx" ON "DirectOrderChannel"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "ContactSubmission_status_idx" ON "ContactSubmission"("status");

-- CreateIndex
CREATE INDEX "ContactSubmission_read_idx" ON "ContactSubmission"("read");

-- CreateIndex
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFaq" ADD CONSTRAINT "ProductFaq_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTab" ADD CONSTRAINT "ProductTab_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTestimonial" ADD CONSTRAINT "VideoTestimonial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

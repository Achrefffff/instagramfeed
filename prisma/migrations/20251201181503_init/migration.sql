-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramConfig" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastRefreshedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "ownerUsername" TEXT,
    "isTagged" BOOLEAN NOT NULL DEFAULT false,
    "mediaUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "carouselImages" TEXT,
    "permalink" TEXT NOT NULL,
    "caption" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "mediaType" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER,
    "reach" INTEGER,
    "saved" INTEGER,
    "hashtags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstagramConfig_shop_isActive_idx" ON "InstagramConfig"("shop", "isActive");

-- CreateIndex
CREATE INDEX "InstagramConfig_shop_tokenExpiresAt_idx" ON "InstagramConfig"("shop", "tokenExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConfig_shop_username_key" ON "InstagramConfig"("shop", "username");

-- CreateIndex
CREATE INDEX "InstagramPost_shop_username_idx" ON "InstagramPost"("shop", "username");

-- CreateIndex
CREATE INDEX "InstagramPost_shop_timestamp_idx" ON "InstagramPost"("shop", "timestamp");

-- CreateIndex
CREATE INDEX "InstagramPost_shop_likeCount_idx" ON "InstagramPost"("shop", "likeCount");

-- CreateIndex
CREATE INDEX "InstagramPost_shop_commentsCount_idx" ON "InstagramPost"("shop", "commentsCount");

-- CreateIndex
CREATE INDEX "InstagramPost_shop_impressions_idx" ON "InstagramPost"("shop", "impressions");

-- CreateIndex
CREATE INDEX "InstagramPost_shop_reach_idx" ON "InstagramPost"("shop", "reach");

-- CreateIndex
CREATE INDEX "InstagramPost_shop_saved_idx" ON "InstagramPost"("shop", "saved");

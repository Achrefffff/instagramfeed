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
    "instagramId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastRefreshedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "permalink" TEXT NOT NULL,
    "caption" TEXT,
    "mediaType" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER,
    "reach" INTEGER,
    "saved" INTEGER,
    "isTagged" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConfig_shop_key" ON "InstagramConfig"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConfig_instagramId_key" ON "InstagramConfig"("instagramId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConfig_username_key" ON "InstagramConfig"("username");

-- CreateIndex
CREATE INDEX "InstagramConfig_tokenExpiresAt_idx" ON "InstagramConfig"("tokenExpiresAt");

-- CreateIndex
CREATE INDEX "InstagramConfig_isActive_idx" ON "InstagramConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramPost_id_configId_key" ON "InstagramPost"("id", "configId");

-- CreateIndex
CREATE INDEX "InstagramPost_configId_publishedAt_idx" ON "InstagramPost"("configId", "publishedAt");

-- CreateIndex
CREATE INDEX "InstagramPost_configId_likeCount_idx" ON "InstagramPost"("configId", "likeCount");

-- CreateIndex
CREATE INDEX "InstagramPost_configId_impressions_idx" ON "InstagramPost"("configId", "impressions");

-- CreateIndex
CREATE INDEX "InstagramPost_configId_isTagged_idx" ON "InstagramPost"("configId", "isTagged");

-- AddForeignKey
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_configId_fkey" FOREIGN KEY ("configId") REFERENCES "InstagramConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;


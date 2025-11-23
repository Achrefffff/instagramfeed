-- CreateTable
CREATE TABLE "InstagramConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "caption" TEXT,
    "timestamp" DATETIME NOT NULL,
    "mediaType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConfig_shop_key" ON "InstagramConfig"("shop");

-- CreateIndex
CREATE INDEX "InstagramPost_shop_timestamp_idx" ON "InstagramPost"("shop", "timestamp");

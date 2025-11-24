-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InstagramPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "caption" TEXT,
    "timestamp" DATETIME NOT NULL,
    "mediaType" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER,
    "reach" INTEGER,
    "saved" INTEGER,
    "hashtags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_InstagramPost" ("caption", "createdAt", "id", "mediaType", "mediaUrl", "permalink", "shop", "timestamp") SELECT "caption", "createdAt", "id", "mediaType", "mediaUrl", "permalink", "shop", "timestamp" FROM "InstagramPost";
DROP TABLE "InstagramPost";
ALTER TABLE "new_InstagramPost" RENAME TO "InstagramPost";
CREATE INDEX "InstagramPost_shop_timestamp_idx" ON "InstagramPost"("shop", "timestamp");
CREATE INDEX "InstagramPost_shop_likeCount_idx" ON "InstagramPost"("shop", "likeCount");
CREATE INDEX "InstagramPost_shop_commentsCount_idx" ON "InstagramPost"("shop", "commentsCount");
CREATE INDEX "InstagramPost_shop_impressions_idx" ON "InstagramPost"("shop", "impressions");
CREATE INDEX "InstagramPost_shop_reach_idx" ON "InstagramPost"("shop", "reach");
CREATE INDEX "InstagramPost_shop_saved_idx" ON "InstagramPost"("shop", "saved");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

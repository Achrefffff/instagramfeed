/*
  Warnings:

  - A unique constraint covering the columns `[shop,username]` on the table `InstagramConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "InstagramConfig_shop_key";

-- CreateIndex
CREATE INDEX "InstagramConfig_shop_isActive_idx" ON "InstagramConfig"("shop", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConfig_shop_username_key" ON "InstagramConfig"("shop", "username");

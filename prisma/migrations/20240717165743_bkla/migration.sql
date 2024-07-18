/*
  Warnings:

  - You are about to drop the column `createdAt` on the `AuthToken` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AuthToken` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuthToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuthToken" ("accessToken", "id", "refreshToken") SELECT "accessToken", "id", "refreshToken" FROM "AuthToken";
DROP TABLE "AuthToken";
ALTER TABLE "new_AuthToken" RENAME TO "AuthToken";
CREATE UNIQUE INDEX "AuthToken_accessToken_key" ON "AuthToken"("accessToken");
CREATE UNIQUE INDEX "AuthToken_refreshToken_key" ON "AuthToken"("refreshToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

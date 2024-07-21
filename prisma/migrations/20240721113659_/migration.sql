/*
  Warnings:

  - You are about to drop the column `exchange` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `instrumentType` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `segment` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Trade` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tag" TEXT NOT NULL,
    "tradingsymbol" TEXT NOT NULL,
    "buyOrSell" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "averagePrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Trade" ("averagePrice", "buyOrSell", "createdAt", "id", "quantity", "tag", "tradingsymbol", "updatedAt") SELECT "averagePrice", "buyOrSell", "createdAt", "id", "quantity", "tag", "tradingsymbol", "updatedAt" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

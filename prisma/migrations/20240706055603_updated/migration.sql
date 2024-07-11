/*
  Warnings:

  - You are about to drop the column `averatePrice` on the `Ledger` table. All the data in the column will be lost.
  - Added the required column `averagePrice` to the `Ledger` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "tradingsymbol" TEXT NOT NULL,
    "token" INTEGER NOT NULL,
    "averagePrice" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "instrumentType" TEXT NOT NULL,
    "buyOrSell" TEXT NOT NULL,
    "tag" TEXT NOT NULL
);
INSERT INTO "new_Ledger" ("buyOrSell", "id", "instrumentType", "quantity", "status", "tag", "token", "tradingsymbol") SELECT "buyOrSell", "id", "instrumentType", "quantity", "status", "tag", "token", "tradingsymbol" FROM "Ledger";
DROP TABLE "Ledger";
ALTER TABLE "new_Ledger" RENAME TO "Ledger";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

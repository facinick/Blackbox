/*
  Warnings:

  - You are about to drop the `Ledger` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Ledger";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradingsymbol" TEXT NOT NULL,
    "token" INTEGER NOT NULL,
    "averagePrice" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "instrumentType" TEXT NOT NULL,
    "buyOrSell" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "tag" TEXT NOT NULL
);

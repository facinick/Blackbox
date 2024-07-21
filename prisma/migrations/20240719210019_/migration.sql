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
    "instrumentType" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "token" INTEGER NOT NULL,
    "exchange" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Trade" ("averagePrice", "buyOrSell", "createdAt", "exchange", "id", "instrumentType", "quantity", "segment", "tag", "token", "tradingsymbol", "updatedAt") SELECT "averagePrice", "buyOrSell", "createdAt", "exchange", "id", "instrumentType", "quantity", "segment", "tag", "token", "tradingsymbol", "updatedAt" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "tradingsymbol" TEXT NOT NULL,
    "token" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "instrumentType" TEXT NOT NULL,
    "buyOrSell" TEXT NOT NULL,
    "tag" TEXT NOT NULL
);

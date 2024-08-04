-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "tag" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "averagePrice" REAL NOT NULL,
    "tradingsymbol" TEXT NOT NULL,
    "buyOrSell" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "brokerOrderId" TEXT NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateTable
CREATE TABLE "RentStrategyLossRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "equityTradingsymbol" TEXT NOT NULL,
    "signedLoss" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_accessToken_key" ON "AuthToken"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_userId_key" ON "AuthToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_brokerOrderId_key" ON "Trade"("brokerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "RentStrategyLossRecord_equityTradingsymbol_key" ON "RentStrategyLossRecord"("equityTradingsymbol");

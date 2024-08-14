-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiry" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ZerodhaAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "zerodhaUserId" TEXT NOT NULL,
    "zerodhaAccessToken" TEXT NOT NULL,
    "zerodhaRefreshToken" TEXT NOT NULL,
    "tokenExpiry" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ZerodhaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ZerodhaAccount_userId_key" ON "ZerodhaAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ZerodhaAccount_zerodhaUserId_key" ON "ZerodhaAccount"("zerodhaUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ZerodhaAccount_zerodhaAccessToken_key" ON "ZerodhaAccount"("zerodhaAccessToken");

-- CreateIndex
CREATE UNIQUE INDEX "ZerodhaAccount_zerodhaRefreshToken_key" ON "ZerodhaAccount"("zerodhaRefreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_brokerOrderId_key" ON "Trade"("brokerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "RentStrategyLossRecord_equityTradingsymbol_key" ON "RentStrategyLossRecord"("equityTradingsymbol");

-- CreateTable
CREATE TABLE "Token" (
    "requestToken" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL
);

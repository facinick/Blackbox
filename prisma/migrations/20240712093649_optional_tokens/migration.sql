-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Token" (
    "requestToken" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT,
    "refreshToken" TEXT
);
INSERT INTO "new_Token" ("accessToken", "refreshToken", "requestToken") SELECT "accessToken", "refreshToken", "requestToken" FROM "Token";
DROP TABLE "Token";
ALTER TABLE "new_Token" RENAME TO "Token";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

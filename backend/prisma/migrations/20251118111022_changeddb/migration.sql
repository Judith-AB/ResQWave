/*
  Warnings:

  - You are about to drop the `ResolveVote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `adminResolved` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `conflictBy` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `conflictRaised` on the `Request` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ResolveVote_requestId_role_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ResolveVote";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "victimName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "emergencyType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "urgencyScore" REAL NOT NULL DEFAULT 0.0,
    "rejectionCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "isResolvedByVictim" BOOLEAN NOT NULL DEFAULT false,
    "isResolvedByVolunteer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Request" ("contact", "createdAt", "details", "emergencyType", "id", "isResolvedByVictim", "isResolvedByVolunteer", "location", "rejectionCount", "status", "urgencyScore", "victimName") SELECT "contact", "createdAt", "details", "emergencyType", "id", "isResolvedByVictim", "isResolvedByVolunteer", "location", "rejectionCount", "status", "urgencyScore", "victimName" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

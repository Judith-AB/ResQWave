-- CreateTable
CREATE TABLE "ResolveVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "ResolveVote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conflictRaised" BOOLEAN NOT NULL DEFAULT false,
    "conflictBy" TEXT,
    "adminResolved" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Request" ("contact", "createdAt", "details", "emergencyType", "id", "isResolvedByVictim", "isResolvedByVolunteer", "location", "rejectionCount", "status", "urgencyScore", "victimName") SELECT "contact", "createdAt", "details", "emergencyType", "id", "isResolvedByVictim", "isResolvedByVolunteer", "location", "rejectionCount", "status", "urgencyScore", "victimName" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ResolveVote_requestId_role_key" ON "ResolveVote"("requestId", "role");

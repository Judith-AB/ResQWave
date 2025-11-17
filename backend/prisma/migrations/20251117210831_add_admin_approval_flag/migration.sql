-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "skills" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "isVolunteer" BOOLEAN NOT NULL DEFAULT false,
    "isMedicalVerified" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("contact", "fullName", "id", "isMedicalVerified", "isVolunteer", "location", "passwordHash", "skills", "status", "username") SELECT "contact", "fullName", "id", "isMedicalVerified", "isVolunteer", "location", "passwordHash", "skills", "status", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

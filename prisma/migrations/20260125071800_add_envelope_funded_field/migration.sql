/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "UserSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "weekStart" INTEGER NOT NULL DEFAULT 0,
    "defaultDomain" TEXT NOT NULL DEFAULT 'TIME',
    "defaultPeriod" TEXT NOT NULL DEFAULT 'WEEKLY',
    "timeCapacity" INTEGER NOT NULL DEFAULT 168,
    "baseMoneyCapacity" REAL NOT NULL DEFAULT 0,
    "autoBudget" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BudgetPeriod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "domain" TEXT NOT NULL DEFAULT 'MONEY',
    "capacity" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "BudgetPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BudgetPeriod" ("id", "isClosed", "startDate", "type", "userId") SELECT "id", "isClosed", "startDate", "type", "userId" FROM "BudgetPeriod";
DROP TABLE "BudgetPeriod";
ALTER TABLE "new_BudgetPeriod" RENAME TO "BudgetPeriod";
CREATE UNIQUE INDEX "BudgetPeriod_userId_startDate_type_domain_key" ON "BudgetPeriod"("userId", "startDate", "type", "domain");
CREATE TABLE "new_Envelope" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "budgeted" DECIMAL NOT NULL,
    "funded" DECIMAL NOT NULL DEFAULT 0,
    "periodId" INTEGER NOT NULL,
    CONSTRAINT "Envelope_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "BudgetPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Envelope" ("budgeted", "color", "id", "name", "periodId") SELECT "budgeted", "color", "id", "name", "periodId" FROM "Envelope";
DROP TABLE "Envelope";
ALTER TABLE "new_Envelope" RENAME TO "Envelope";
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "envelopeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" DATETIME,
    "endTime" DATETIME,
    CONSTRAINT "Transaction_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "Envelope" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "date", "description", "endTime", "envelopeId", "id", "startTime") SELECT "amount", "createdAt", "date", "description", "endTime", "envelopeId", "id", "startTime" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name") SELECT "createdAt", "email", "id", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

/*
  Warnings:

  - You are about to alter the column `capacity` on the `BudgetPeriod` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `budgeted` on the `Envelope` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `funded` on the `Envelope` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `timeCapacity` on the `UserSettings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE "BudgetPeriod" ALTER COLUMN "capacity" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Envelope" ALTER COLUMN "budgeted" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "funded" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "UserSettings" ALTER COLUMN "timeCapacity" SET DATA TYPE DECIMAL(12,2);

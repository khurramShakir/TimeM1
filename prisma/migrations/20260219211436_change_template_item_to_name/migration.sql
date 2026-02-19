/*
  Warnings:

  - You are about to drop the column `envelopeId` on the `BudgetTemplateItem` table. All the data in the column will be lost.
  - Added the required column `envelopeName` to the `BudgetTemplateItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BudgetTemplateItem" DROP COLUMN "envelopeId",
ADD COLUMN     "envelopeName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BudgetPeriod" ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "BudgetTemplate" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBuiltIn" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "BudgetPeriod" ADD CONSTRAINT "BudgetPeriod_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BudgetTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

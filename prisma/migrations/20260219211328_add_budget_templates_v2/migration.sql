-- CreateEnum
CREATE TYPE "FundingMode" AS ENUM ('ADD', 'RESET');

-- CreateEnum
CREATE TYPE "TemplateFundingModeOverride" AS ENUM ('ADD', 'RESET', 'INHERIT');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "entity" TEXT,
ADD COLUMN     "isSystemAdjustment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refNumber" TEXT,
ADD COLUMN     "toEnvelopeId" INTEGER;

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "fontFamily" TEXT DEFAULT 'var(--font-courier-prime)',
ADD COLUMN     "fontSize" INTEGER NOT NULL DEFAULT 18;

-- CreateTable
CREATE TABLE "BudgetTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'MONEY',
    "isAutoFillEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultFundingMode" "FundingMode" NOT NULL DEFAULT 'ADD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "envelopeId" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fundingModeOverride" "TemplateFundingModeOverride" NOT NULL DEFAULT 'INHERIT',

    CONSTRAINT "BudgetTemplateItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toEnvelopeId_fkey" FOREIGN KEY ("toEnvelopeId") REFERENCES "Envelope"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetTemplate" ADD CONSTRAINT "BudgetTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetTemplateItem" ADD CONSTRAINT "BudgetTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BudgetTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

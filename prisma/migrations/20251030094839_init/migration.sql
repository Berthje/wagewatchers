-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('BUG', 'FEATURE', 'IMPROVEMENT');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "public"."SalaryEntry" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT,
    "subreddit" TEXT,
    "age" INTEGER,
    "education" TEXT,
    "workExperience" INTEGER,
    "civilStatus" TEXT,
    "dependents" INTEGER,
    "sector" TEXT,
    "employeeCount" TEXT,
    "multinational" BOOLEAN,
    "jobTitle" TEXT,
    "jobDescription" TEXT,
    "seniority" INTEGER,
    "officialHours" INTEGER,
    "averageHours" INTEGER,
    "shiftDescription" TEXT,
    "onCall" TEXT,
    "vacationDays" INTEGER,
    "currency" TEXT DEFAULT 'EUR',
    "grossSalary" DOUBLE PRECISION,
    "netSalary" DOUBLE PRECISION,
    "netCompensation" DOUBLE PRECISION,
    "mobility" TEXT,
    "thirteenthMonth" TEXT,
    "mealVouchers" DOUBLE PRECISION,
    "ecoCheques" DOUBLE PRECISION,
    "groupInsurance" TEXT,
    "otherInsurances" TEXT,
    "otherBenefits" TEXT,
    "workCity" TEXT,
    "commuteDistance" TEXT,
    "commuteMethod" TEXT,
    "commuteCompensation" TEXT,
    "teleworkDays" INTEGER,
    "dayOffEase" TEXT,
    "stressLevel" TEXT,
    "reports" INTEGER,
    "source" TEXT,
    "sourceUrl" TEXT,
    "extraNotes" TEXT,
    "isManualEntry" BOOLEAN NOT NULL DEFAULT true,
    "lastCommentsFetch" TIMESTAMP(3),
    "ownerToken" TEXT,
    "editableUntil" TIMESTAMP(3),

    CONSTRAINT "SalaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT,
    "body" TEXT NOT NULL,
    "author" TEXT,
    "score" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "salaryEntryId" INTEGER NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'TODO',
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "trackingId" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExchangeRate" (
    "id" SERIAL NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryEntry_ownerToken_idx" ON "public"."SalaryEntry"("ownerToken");

-- CreateIndex
CREATE INDEX "Comment_salaryEntryId_idx" ON "public"."Comment"("salaryEntryId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "public"."Comment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_trackingId_key" ON "public"."Report"("trackingId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currency_key" ON "public"."ExchangeRate"("currency");

-- CreateIndex
CREATE INDEX "ExchangeRate_currency_idx" ON "public"."ExchangeRate"("currency");

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_salaryEntryId_fkey" FOREIGN KEY ("salaryEntryId") REFERENCES "public"."SalaryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to alter the column `officialHours` on the `SalaryEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `averageHours` on the `SalaryEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `teleworkDays` on the `SalaryEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."SalaryEntry" ALTER COLUMN "officialHours" SET DATA TYPE INTEGER,
ALTER COLUMN "averageHours" SET DATA TYPE INTEGER,
ALTER COLUMN "teleworkDays" SET DATA TYPE INTEGER;

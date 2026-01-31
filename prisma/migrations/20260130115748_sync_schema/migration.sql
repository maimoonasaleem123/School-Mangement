/*
  Warnings:

  - A unique constraint covering the columns `[cnic]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "cnic" TEXT;

-- CreateTable
CREATE TABLE "Form" (
    "id" SERIAL NOT NULL,
    "table" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Form_table_key" ON "Form"("table");

-- CreateIndex
CREATE UNIQUE INDEX "Student_cnic_key" ON "Student"("cnic");

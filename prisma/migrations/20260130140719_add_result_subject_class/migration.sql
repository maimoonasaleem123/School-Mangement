-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "classId" INTEGER,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "percent" DOUBLE PRECISION,
ADD COLUMN     "subjectId" INTEGER,
ADD COLUMN     "total" INTEGER;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

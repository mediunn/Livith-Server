/*
  Warnings:

  - A unique constraint covering the columns `[concert_id,date]` on the table `setlists` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `setlists_date_key` ON `setlists`;

-- CreateIndex
CREATE UNIQUE INDEX `setlists_concert_id_date_key` ON `setlists`(`concert_id`, `date`);

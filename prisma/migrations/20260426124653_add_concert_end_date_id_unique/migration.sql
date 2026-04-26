/*
  Warnings:

  - A unique constraint covering the columns `[end_date,id]` on the table `concerts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `concerts_end_date_id_key` ON `concerts`(`end_date`, `id`);

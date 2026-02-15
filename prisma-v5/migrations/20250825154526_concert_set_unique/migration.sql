/*
  Warnings:

  - A unique constraint covering the columns `[start_date,id]` on the table `concerts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,id]` on the table `concerts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `concerts_start_date_id_key` ON `concerts`(`start_date`, `id`);

-- CreateIndex
CREATE UNIQUE INDEX `concerts_title_id_key` ON `concerts`(`title`, `id`);

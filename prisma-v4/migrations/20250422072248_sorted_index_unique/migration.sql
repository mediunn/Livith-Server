/*
  Warnings:

  - A unique constraint covering the columns `[sorted_index]` on the table `concerts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `concerts_sorted_index_key` ON `concerts`(`sorted_index`);

/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `concerts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `concerts_code_key` ON `concerts`(`code`);

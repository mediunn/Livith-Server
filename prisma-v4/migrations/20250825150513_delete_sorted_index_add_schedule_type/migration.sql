/*
  Warnings:

  - You are about to drop the column `sorted_index` on the `concerts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `concerts_sorted_index_idx` ON `concerts`;

-- DropIndex
DROP INDEX `concerts_sorted_index_key` ON `concerts`;

-- AlterTable
ALTER TABLE `concerts` DROP COLUMN `sorted_index`;

-- AlterTable
ALTER TABLE `schedule` ADD COLUMN `type` ENUM('CONCERT', 'TICKETING') NULL;

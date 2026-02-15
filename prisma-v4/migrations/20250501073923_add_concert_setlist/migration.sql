/*
  Warnings:

  - You are about to drop the column `concert_id` on the `setlists` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `setlists` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `setlists` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[date,id]` on the table `setlists` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `setlists` DROP FOREIGN KEY `setlists_concert_id_fkey`;

-- DropIndex
DROP INDEX `setlists_concert_id_date_key` ON `setlists`;

-- DropIndex
DROP INDEX `setlists_concert_id_idx` ON `setlists`;

-- AlterTable
ALTER TABLE `setlists` DROP COLUMN `concert_id`,
    DROP COLUMN `status`,
    DROP COLUMN `type`;

-- CreateTable
CREATE TABLE `concert_setlists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `concert_id` INTEGER NOT NULL,
    `setlist_id` INTEGER NOT NULL,
    `type` ENUM('ONGOING', 'PAST', 'EXPECTED') NOT NULL DEFAULT 'ONGOING',
    `status` VARCHAR(10) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `concert_setlists_concert_id_setlist_id_idx`(`concert_id`, `setlist_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `setlists_date_id_key` ON `setlists`(`date`, `id`);

-- AddForeignKey
ALTER TABLE `concert_setlists` ADD CONSTRAINT `concert_setlists_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concert_setlists` ADD CONSTRAINT `concert_setlists_setlist_id_fkey` FOREIGN KEY (`setlist_id`) REFERENCES `setlists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

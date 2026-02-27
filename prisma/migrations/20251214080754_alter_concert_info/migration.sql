/*
  Warnings:

  - You are about to drop the column `category` on the `concert_info` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `concert_info` table. All the data in the column will be lost.
  - You are about to drop the column `img_url` on the `concert_info` table. All the data in the column will be lost.
  - Added the required column `info_id` to the `concert_info` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `concert_info` DROP FOREIGN KEY `concert_info_concert_id_fkey`;

-- DropIndex
DROP INDEX `uk_concert_category` ON `concert_info`;

-- AlterTable
ALTER TABLE `concert_info` DROP COLUMN `category`,
    DROP COLUMN `content`,
    DROP COLUMN `img_url`,
    ADD COLUMN `info_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(30) NOT NULL,
    `content` VARCHAR(100) NOT NULL,
    `img_url` VARCHAR(2048) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `concert_info` ADD CONSTRAINT `concert_info_info_id_fkey` FOREIGN KEY (`info_id`) REFERENCES `info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE `schedule` ADD CONSTRAINT `schedule_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `carousel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `carousel_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `carousel_items` DROP FOREIGN KEY `carousel_items_carousel_id_fkey`;

-- DropTable
DROP TABLE `carousel`;

-- DropTable
DROP TABLE `carousel_items`;

-- CreateTable
CREATE TABLE `banners` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `img_url` VARCHAR(100) NULL,
    `category` VARCHAR(30) NULL,
    `title` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

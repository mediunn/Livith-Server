/*
  Warnings:

  - You are about to drop the column `birth_date` on the `artists` table. All the data in the column will be lost.
  - You are about to drop the column `birth_place` on the `artists` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `artists` DROP COLUMN `birth_date`,
    DROP COLUMN `birth_place`,
    ADD COLUMN `debut_date` VARCHAR(30) NULL,
    ADD COLUMN `debut_place` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `concerts` ADD COLUMN `genre` VARCHAR(30) NULL,
    ADD COLUMN `introduction` TEXT NULL,
    ADD COLUMN `label` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `setlist_songs` ADD COLUMN `fancahnt_point` TEXT NULL;

-- CreateTable
CREATE TABLE `home_concert_sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `home_section_id` INTEGER NOT NULL,
    `concert_id` INTEGER NOT NULL,
    `section_title` VARCHAR(30) NOT NULL,
    `concert_title` VARCHAR(300) NOT NULL,
    `sorted_index` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `home_sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `section_title` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `search_concert_sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `search_section_id` INTEGER NOT NULL,
    `concert_id` INTEGER NOT NULL,
    `section_title` VARCHAR(30) NOT NULL,
    `concert_title` VARCHAR(300) NOT NULL,
    `sorted_index` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `search_sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `section_title` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `home_concert_sections` ADD CONSTRAINT `home_concert_sections_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `home_concert_sections` ADD CONSTRAINT `home_concert_sections_home_section_id_fkey` FOREIGN KEY (`home_section_id`) REFERENCES `home_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `search_concert_sections` ADD CONSTRAINT `search_concert_sections_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `search_concert_sections` ADD CONSTRAINT `search_concert_sections_search_section_id_fkey` FOREIGN KEY (`search_section_id`) REFERENCES `search_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

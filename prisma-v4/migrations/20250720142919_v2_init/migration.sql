/*
  Warnings:

  - You are about to drop the column `date` on the `setlists` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[start_date,end_date,id]` on the table `setlists` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `concert_date` to the `concert_setlists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `concert_title` to the `concert_setlists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `setlist_date` to the `concert_setlists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `setlist_title` to the `concert_setlists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `artist_id` to the `concerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `cultures` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `cultures` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `setlist_date` to the `setlist_songs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `setlist_title` to the `setlist_songs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `song_title` to the `setlist_songs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `setlist_songs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_date` to the `setlists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `setlists` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `setlists_date_id_key` ON `setlists`;

-- AlterTable
ALTER TABLE `concert_setlists` ADD COLUMN `concert_date` VARCHAR(20) NOT NULL,
    ADD COLUMN `concert_title` VARCHAR(300) NOT NULL,
    ADD COLUMN `setlist_date` VARCHAR(20) NOT NULL,
    ADD COLUMN `setlist_title` VARCHAR(300) NOT NULL;

-- AlterTable
ALTER TABLE `concerts` ADD COLUMN `artist_id` INTEGER NOT NULL,
    ADD COLUMN `ticket_site` INTEGER NULL,
    ADD COLUMN `ticket_url` VARCHAR(2048) NULL,
    ADD COLUMN `venue` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `cultures` ADD COLUMN `title` TEXT NOT NULL,
    MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `setlist_songs` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `setlist_date` VARCHAR(20) NOT NULL,
    ADD COLUMN `setlist_title` VARCHAR(300) NOT NULL,
    ADD COLUMN `song_title` VARCHAR(50) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `setlists` DROP COLUMN `date`,
    ADD COLUMN `end_date` VARCHAR(20) NOT NULL,
    ADD COLUMN `start_date` VARCHAR(20) NOT NULL,
    ADD COLUMN `venue` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `songs` ADD COLUMN `youtube_url` VARCHAR(2048) NULL;

-- CreateTable
CREATE TABLE `artists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `artist` VARCHAR(100) NOT NULL,
    `birth_date` VARCHAR(30) NULL,
    `birth_place` VARCHAR(100) NULL,
    `category` VARCHAR(30) NULL,
    `detail` TEXT NULL,
    `instagram_url` VARCHAR(2048) NULL,
    `keywords` VARCHAR(100) NULL,
    `img_url` VARCHAR(2048) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concert_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `concert_id` INTEGER NOT NULL,
    `category` VARCHAR(30) NOT NULL,
    `content` VARCHAR(100) NOT NULL,
    `img_url` VARCHAR(2048) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `md` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `concert_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `price` VARCHAR(30) NULL,
    `img_url` VARCHAR(2048) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `concert_id` INTEGER NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `setlists_start_date_end_date_id_key` ON `setlists`(`start_date`, `end_date`, `id`);

-- AddForeignKey
ALTER TABLE `concerts` ADD CONSTRAINT `concerts_artist_id_fkey` FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concert_info` ADD CONSTRAINT `concert_info_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `md` ADD CONSTRAINT `md_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule` ADD CONSTRAINT `schedule_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

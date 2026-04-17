/*
  Warnings:

  - The values [CLASSIC_JAZZ,ACOUSTIC,ELECTRONIC] on the enum `user_genres_genre_name` will be removed. If these variants are still used in the database, this will fail.
  - The values [CLASSIC_JAZZ,ACOUSTIC,ELECTRONIC] on the enum `user_genres_genre_name` will be removed. If these variants are still used in the database, this will fail.
  - The values [TICKETING] on the enum `schedule_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [CLASSIC_JAZZ,ACOUSTIC,ELECTRONIC] on the enum `user_genres_genre_name` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `interest_concert_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_interest_concert_id_fkey`;

-- DropIndex
DROP INDEX `users_interest_concert_id_fkey` ON `users`;

-- AlterTable
ALTER TABLE `artists` ADD COLUMN `twitter_url` VARCHAR(2048) NULL;

-- AlterTable
ALTER TABLE `concert_genres` MODIFY `name` ENUM('JPOP', 'ROCK_METAL', 'RAP_HIPHOP', 'POP', 'INDIE') NOT NULL;

-- AlterTable
ALTER TABLE `concerts` MODIFY `title` VARCHAR(300) NULL,
    MODIFY `start_date` VARCHAR(20) NULL,
    MODIFY `end_date` VARCHAR(20) NULL,
    MODIFY `poster` VARCHAR(2048) NULL,
    MODIFY `venue` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `genres` MODIFY `name` ENUM('JPOP', 'ROCK_METAL', 'RAP_HIPHOP', 'POP', 'INDIE') NOT NULL;

-- AlterTable
ALTER TABLE `schedule` MODIFY `type` ENUM('CONCERT', 'PRE_TICKETING', 'GENERAL_TICKETING') NULL;

-- AlterTable
ALTER TABLE `user_genres` MODIFY `genre_name` ENUM('JPOP', 'ROCK_METAL', 'RAP_HIPHOP', 'POP', 'INDIE') NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `interest_concert_id`;

-- CreateTable
CREATE TABLE `user_interest_concerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `concert_id` INTEGER NOT NULL,
    `concert_title` VARCHAR(300) NULL,
    `user_nickname` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_interest_concerts_user_id_idx`(`user_id`),
    INDEX `user_interest_concerts_concert_id_idx`(`concert_id`),
    UNIQUE INDEX `user_interest_concerts_user_id_concert_id_key`(`user_id`, `concert_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_interest_concerts` ADD CONSTRAINT `user_interest_concerts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_interest_concerts` ADD CONSTRAINT `user_interest_concerts_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

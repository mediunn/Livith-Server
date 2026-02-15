/*
  Warnings:

  - You are about to drop the column `concertId` on the `concert_genres` table. All the data in the column will be lost.
  - You are about to drop the column `genreId` on the `concert_genres` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[concert_id,genre_id]` on the table `concert_genres` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `concert_id` to the `concert_genres` table without a default value. This is not possible if the table is not empty.
  - Added the required column `concert_title` to the `concert_genres` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genre_id` to the `concert_genres` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `concert_genres` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `concert_genres` DROP FOREIGN KEY `concert_genres_concertId_fkey`;

-- DropForeignKey
ALTER TABLE `concert_genres` DROP FOREIGN KEY `concert_genres_genreId_fkey`;

-- DropIndex
DROP INDEX `concert_genres_concertId_genreId_key` ON `concert_genres`;

-- DropIndex
DROP INDEX `concert_genres_genreId_fkey` ON `concert_genres`;

-- AlterTable
ALTER TABLE `concert_genres` DROP COLUMN `concertId`,
    DROP COLUMN `genreId`,
    ADD COLUMN `concert_id` INTEGER NOT NULL,
    ADD COLUMN `concert_title` VARCHAR(300) NOT NULL,
    ADD COLUMN `genre_id` INTEGER NOT NULL,
    ADD COLUMN `name` ENUM('JPOP', 'ROCK_METAL', 'RAP_HIPHOP', 'CLASSIC_JAZZ', 'ACOUSTIC', 'ELECTRONIC') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `concert_genres_concert_id_genre_id_key` ON `concert_genres`(`concert_id`, `genre_id`);

-- AddForeignKey
ALTER TABLE `concert_genres` ADD CONSTRAINT `concert_genres_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concert_genres` ADD CONSTRAINT `concert_genres_genre_id_fkey` FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

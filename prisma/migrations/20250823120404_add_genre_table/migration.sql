/*
  Warnings:

  - You are about to drop the column `genre` on the `concerts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `concerts` DROP COLUMN `genre`;

-- CreateTable
CREATE TABLE `concert_genres` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `concertId` INTEGER NOT NULL,
    `genreId` INTEGER NOT NULL,

    UNIQUE INDEX `concert_genres_concertId_genreId_key`(`concertId`, `genreId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genres` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` ENUM('J_POP', 'ROCK_METAL', 'RAP_HIPHOP', 'CLASSIC_JAZZ', 'ACOUSTIC', 'ELECTRONIC') NOT NULL,

    UNIQUE INDEX `genres_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `concert_genres` ADD CONSTRAINT `concert_genres_concertId_fkey` FOREIGN KEY (`concertId`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concert_genres` ADD CONSTRAINT `concert_genres_genreId_fkey` FOREIGN KEY (`genreId`) REFERENCES `genres`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

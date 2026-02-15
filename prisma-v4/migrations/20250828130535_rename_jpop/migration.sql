/*
  Warnings:

  - The values [J_POP] on the enum `genres_name` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `genres` MODIFY `name` ENUM('JPOP', 'ROCK_METAL', 'RAP_HIPHOP', 'CLASSIC_JAZZ', 'ACOUSTIC', 'ELECTRONIC') NOT NULL;

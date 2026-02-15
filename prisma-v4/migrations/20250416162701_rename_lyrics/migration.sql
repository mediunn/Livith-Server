/*
  Warnings:

  - You are about to drop the column `lyric` on the `songs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `songs` DROP COLUMN `lyric`,
    ADD COLUMN `lyrics` TEXT NULL;

/*
  Warnings:

  - You are about to drop the column `fancahnt_point` on the `setlist_songs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `setlist_songs` DROP COLUMN `fancahnt_point`,
    ADD COLUMN `fanchant_point` TEXT NULL;

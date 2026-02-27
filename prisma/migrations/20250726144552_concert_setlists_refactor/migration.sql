/*
  Warnings:

  - You are about to drop the column `concert_date` on the `concert_setlists` table. All the data in the column will be lost.
  - You are about to drop the column `setlist_date` on the `concert_setlists` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `concert_setlists` DROP COLUMN `concert_date`,
    DROP COLUMN `setlist_date`,
    MODIFY `status` VARCHAR(10) NULL,
    MODIFY `concert_title` VARCHAR(300) NULL,
    MODIFY `setlist_title` VARCHAR(300) NULL;

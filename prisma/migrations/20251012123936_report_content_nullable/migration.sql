/*
  Warnings:

  - Made the column `content` on table `concert_comments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `concert_comments` MODIFY `content` VARCHAR(500) NOT NULL;

-- AlterTable
ALTER TABLE `reports` MODIFY `content` VARCHAR(300) NULL;

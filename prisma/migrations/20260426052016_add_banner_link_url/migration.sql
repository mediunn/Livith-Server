/*
  Warnings:

  - Added the required column `link_url` to the `banners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `banners` ADD COLUMN `link_url` VARCHAR(2048) NULL;

-- Backfill existing rows before enforcing NOT NULL
UPDATE `banners` SET `link_url` = '' WHERE `link_url` IS NULL;

-- AlterTable
ALTER TABLE `banners` MODIFY `link_url` VARCHAR(2048) NOT NULL;

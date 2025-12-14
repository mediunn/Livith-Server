/*
  Warnings:

  - Made the column `img_url` on table `banners` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category` on table `banners` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `banners` required. This step will fail if there are existing NULL values in that column.
  - Made the column `content` on table `banners` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `banners` MODIFY `img_url` VARCHAR(2048) NOT NULL,
    MODIFY `category` VARCHAR(30) NOT NULL,
    MODIFY `title` VARCHAR(50) NOT NULL,
    MODIFY `content` VARCHAR(100) NOT NULL;

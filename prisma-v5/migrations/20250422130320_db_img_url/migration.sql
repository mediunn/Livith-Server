/*
  Warnings:

  - You are about to drop the column `imgUrl` on the `setlists` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `setlists` DROP COLUMN `imgUrl`,
    ADD COLUMN `img_url` VARCHAR(100) NULL;

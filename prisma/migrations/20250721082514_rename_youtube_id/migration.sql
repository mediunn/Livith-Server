/*
  Warnings:

  - You are about to drop the column `youtube_url` on the `songs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `songs` DROP COLUMN `youtube_url`,
    ADD COLUMN `youtube_id` VARCHAR(200) NULL;

/*
  Warnings:

  - You are about to drop the column `deep_link` on the `notificationhistories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `notificationhistories` DROP COLUMN `deep_link`,
    ADD COLUMN `target_id` VARCHAR(500) NULL;

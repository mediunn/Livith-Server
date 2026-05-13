/*
  Warnings:

  - The values [MARKETING_PUSH] on the enum `notification_consents_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `notification_consents` MODIFY `type` ENUM('BENEFIT_PUSH', 'NIGHT_PUSH') NOT NULL;

-- AlterTable
ALTER TABLE `notification_sets` ADD COLUMN `benefit_alert` BOOLEAN NOT NULL DEFAULT false;

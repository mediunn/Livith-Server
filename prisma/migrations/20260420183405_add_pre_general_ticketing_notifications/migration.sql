/*
  Warnings:

  - The values [TICKET_7D,TICKET_1D,TICKET_TODAY] on the enum `notificationhistories_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `notificationhistories` ADD COLUMN `schedule_id` INTEGER NULL,
    MODIFY `type` ENUM('INTEREST_CONCERT', 'PRE_TICKETING_OPEN', 'GENERAL_TICKETING_OPEN', 'PRE_TICKETING_1D', 'GENERAL_TICKETING_1D', 'PRE_TICKETING_30MIN', 'GENERAL_TICKETING_30MIN', 'CONCERT_INFO_UPDATE_SETLIST', 'CONCERT_INFO_UPDATE_MD', 'CONCERT_INFO_UPDATE_DETAIL', 'CONCERT_INFO_UPDATE_SCHEDULE', 'CONCERT_INFO_UPDATE_TICKET', 'ARTIST_CONCERT_OPEN', 'RECOMMEND') NOT NULL;

-- CreateIndex
CREATE INDEX `notificationhistories_schedule_id_type_idx` ON `notificationhistories`(`schedule_id`, `type`);

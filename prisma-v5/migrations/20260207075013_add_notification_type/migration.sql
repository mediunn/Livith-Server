/*
  Warnings:

  - The values [CONCERT_INFO_UPDATE] on the enum `notificationhistories_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `notificationhistories` MODIFY `type` ENUM('INTEREST_CONCERT', 'TICKET_7D', 'TICKET_1D', 'TICKET_TODAY', 'CONCERT_INFO_UPDATE_SETLIST', 'CONCERT_INFO_UPDATE_MD', 'CONCERT_INFO_UPDATE_DETAIL', 'CONCERT_INFO_UPDATE_SCHEDULE', 'CONCERT_INFO_UPDATE_TICKET', 'ARTIST_CONCERT_OPEN', 'RECOMMEND') NOT NULL;

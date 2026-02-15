/*
  Warnings:

  - The values [DELETED] on the enum `concerts_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `concerts` MODIFY `status` ENUM('ONGOING', 'UPCOMING', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'ONGOING';

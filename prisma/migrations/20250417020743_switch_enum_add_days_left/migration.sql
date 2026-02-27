/*
  Warnings:

  - You are about to alter the column `status` on the `concerts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(10)` to `Enum(EnumId(0))`.
  - Added the required column `days_left` to the `concerts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `concerts` ADD COLUMN `days_left` BIGINT NOT NULL,
    MODIFY `status` ENUM('ONGOING', 'UPCOMING', 'COMPLETED') NOT NULL DEFAULT 'ONGOING';

/*
  Warnings:

  - Made the column `status` on table `concerts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `poster` on table `concerts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `artist` on table `concerts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `venue` on table `concerts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `introduction` on table `concerts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `concerts` MODIFY `status` ENUM('ONGOING', 'UPCOMING', 'COMPLETED', 'CANCELED') NOT NULL,
    MODIFY `poster` VARCHAR(2048) NOT NULL,
    MODIFY `artist` VARCHAR(100) NOT NULL,
    MODIFY `venue` VARCHAR(100) NOT NULL,
    MODIFY `introduction` TEXT NOT NULL;

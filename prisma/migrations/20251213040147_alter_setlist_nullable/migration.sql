/*
  Warnings:

  - Made the column `artist` on table `setlists` required. This step will fail if there are existing NULL values in that column.
  - Made the column `venue` on table `setlists` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `setlists` MODIFY `artist` VARCHAR(100) NOT NULL,
    MODIFY `venue` VARCHAR(100) NOT NULL;

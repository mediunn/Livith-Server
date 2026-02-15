/*
  Warnings:

  - Made the column `date` on table `setlists` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `setlists` MODIFY `date` VARCHAR(191) NOT NULL;

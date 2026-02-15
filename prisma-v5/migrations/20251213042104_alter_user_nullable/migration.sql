/*
  Warnings:

  - Made the column `nickname` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `nickname` VARCHAR(50) NOT NULL;

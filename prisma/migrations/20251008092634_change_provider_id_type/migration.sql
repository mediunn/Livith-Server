/*
  Warnings:

  - You are about to alter the column `provider_id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Int`.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `provider_id` INTEGER NOT NULL;

/*
  Warnings:

  - A unique constraint covering the columns `[provider_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_interest_concert_id_fkey`;

-- DropIndex
DROP INDEX `users_interest_concert_id_key` ON `users`;

-- DropIndex
DROP INDEX `users_provider_provider_id_key` ON `users`;

-- CreateIndex
CREATE UNIQUE INDEX `users_provider_id_key` ON `users`(`provider_id`);
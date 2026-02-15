/*
  Warnings:

  - A unique constraint covering the columns `[concert_id,category]` on the table `concert_info` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `concerts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[concert_id,title]` on the table `cultures` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[concert_id,scheduled_at]` on the table `schedule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,artist]` on the table `setlists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,artist]` on the table `songs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provider,provider_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `marketing_consent` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_comment_id_fkey`;

-- DropIndex
DROP INDEX `reports_comment_id_fkey` ON `reports`;

-- DropIndex
DROP INDEX `users_provider_id_key` ON `users`;

-- AlterTable
ALTER TABLE `concerts` MODIFY `status` ENUM('ONGOING', 'UPCOMING', 'COMPLETED', 'CANCELED') NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `marketing_consent` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `uk_concert_category` ON `concert_info`(`concert_id`, `category`);

-- CreateIndex
CREATE UNIQUE INDEX `uk_title` ON `concerts`(`title`);

-- CreateIndex
CREATE UNIQUE INDEX `uk_concert_title` ON `cultures`(`concert_id`, `title`(255));

-- CreateIndex
CREATE UNIQUE INDEX `unique_schedule` ON `schedule`(`concert_id`, `scheduled_at`);

-- CreateIndex
CREATE UNIQUE INDEX `uk_title_artist` ON `setlists`(`title`, `artist`);

-- CreateIndex
CREATE UNIQUE INDEX `uk_title_artist` ON `songs`(`title`, `artist`);

-- CreateIndex
CREATE UNIQUE INDEX `users_provider_provider_id_key` ON `users`(`provider`, `provider_id`);

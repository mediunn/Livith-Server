/*
  Warnings:

  - You are about to drop the column `content` on the `reports` table. All the data in the column will be lost.
  - Added the required column `comment_content` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `comment_user_id` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_comment_id_fkey`;

-- DropIndex
DROP INDEX `reports_comment_id_fkey` ON `reports`;

-- AlterTable
ALTER TABLE `reports` DROP COLUMN `content`,
    ADD COLUMN `comment_content` VARCHAR(500) NOT NULL,
    ADD COLUMN `comment_user_id` INTEGER NOT NULL,
    ADD COLUMN `report_reason` VARCHAR(300) NULL,
    MODIFY `comment_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `concert_comments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

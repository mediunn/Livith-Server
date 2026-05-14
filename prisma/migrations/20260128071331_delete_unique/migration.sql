-- DropForeignKey
ALTER TABLE `notificationhistories` DROP FOREIGN KEY `notificationhistories_user_id_fkey`;

-- DropIndex
DROP INDEX `notificationhistories_user_id_key` ON `notificationhistories`;


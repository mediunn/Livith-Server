-- AlterTable
ALTER TABLE `notification_sets` ADD COLUMN `night_alert` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `recommend_alert` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `notificationhistories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('INTEREST_CONCERT', 'TICKET_7D', 'TICKET_1D', 'TICKET_TODAY', 'CONCERT_INFO_UPDATE', 'ARTIST_CONCERT_OPEN', 'RECOMMEND') NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `deep_link` VARCHAR(500) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `notificationhistories_user_id_key`(`user_id`),
    INDEX `notificationhistories_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `notificationhistories_user_id_is_read_idx`(`user_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_consents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('MARKETING_PUSH', 'NIGHT_PUSH') NOT NULL,
    `is_agreed` BOOLEAN NOT NULL,
    `agreed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_consents_user_id_type_idx`(`user_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notificationhistories` ADD CONSTRAINT `notificationhistories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_consents` ADD CONSTRAINT `notification_consents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

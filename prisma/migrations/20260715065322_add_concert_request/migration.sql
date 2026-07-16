-- CreateTable
CREATE TABLE `concert_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `concert_title` VARCHAR(300) NOT NULL,
    `url` VARCHAR(2048) NULL,
    `request_content` TEXT NULL,
    `auto_register` BOOLEAN NOT NULL DEFAULT false,
    `registration_toast_shown` BOOLEAN NOT NULL DEFAULT false,
    `request_result` ENUM('REGISTERED', 'PAST_CONCERT', 'INSUFFICIENT_INFORMATION', 'UNSUPPORTED_GENRE') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `concert_requests_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `concert_requests` ADD CONSTRAINT `concert_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

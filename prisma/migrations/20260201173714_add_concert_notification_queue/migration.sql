-- CreateTable
CREATE TABLE `concert_notification_queue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `concert_id` INTEGER NOT NULL,
    `event_type` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `concert_notification_queue_processed_created_at_idx`(`processed`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

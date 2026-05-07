-- CreateTable
CREATE TABLE `crawl_history` (
    `id`              INTEGER      NOT NULL AUTO_INCREMENT,
    `account`         VARCHAR(100) NOT NULL,
    `last_crawled_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_account`(`account`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `schedule`
    ADD UNIQUE INDEX `uk_schedule`(`concert_id`, `scheduled_at`, `category`);
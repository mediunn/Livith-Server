-- CreateTable
CREATE TABLE `extraction_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `instagram_url` VARCHAR(2048) NOT NULL,
    `status` ENUM('PENDING', 'EXTRACTING', 'MATCHED', 'NO_MATCH') NOT NULL DEFAULT 'PENDING',
    `result_payload` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `extraction_jobs_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

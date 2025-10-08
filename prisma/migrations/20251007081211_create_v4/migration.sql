-- DropForeignKey
ALTER TABLE `concert_info` DROP FOREIGN KEY `concert_info_concert_id_fkey`;

-- DropForeignKey
ALTER TABLE `cultures` DROP FOREIGN KEY `cultures_concert_id_fkey`;

-- DropIndex
DROP INDEX `uk_artist` ON `artists`;

-- DropIndex
DROP INDEX `uk_concert_category` ON `concert_info`;

-- DropIndex
DROP INDEX `uk_title` ON `concerts`;

-- DropIndex
DROP INDEX `uk_concert_title` ON `cultures`;

-- DropIndex
DROP INDEX `uk_title_artist` ON `setlists`;

-- DropIndex
DROP INDEX `uk_title_artist` ON `songs`;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `interest_concert_id` INTEGER NULL,
    `provider` ENUM('KAKAO', 'APPLE') NOT NULL,
    `provider_id` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `nickname` VARCHAR(50) NULL,
    `marketing_consent` ENUM('YES', 'NO') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_interest_concert_id_key`(`interest_concert_id`),
    UNIQUE INDEX `users_nickname_key`(`nickname`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `concert_comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `concert_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comment_id` INTEGER NOT NULL,
    `content` VARCHAR(300) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resignations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(300) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `concert_info_concert_id_fkey` ON `concert_info`(`concert_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_interest_concert_id_fkey` FOREIGN KEY (`interest_concert_id`) REFERENCES `concerts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concert_comments` ADD CONSTRAINT `concert_comments_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `concert_comments` ADD CONSTRAINT `concert_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `concert_comments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

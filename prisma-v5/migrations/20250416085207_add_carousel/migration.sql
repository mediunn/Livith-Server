-- CreateTable
CREATE TABLE `carousel` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carousel_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `carousel_id` BIGINT NOT NULL,
    `img_url` VARCHAR(100) NULL,
    `category` VARCHAR(30) NULL,
    `title` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `carousel_items` ADD CONSTRAINT `carousel_items_carousel_id_fkey` FOREIGN KEY (`carousel_id`) REFERENCES `carousel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

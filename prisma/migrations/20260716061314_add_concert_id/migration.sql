-- AlterTable
ALTER TABLE `concert_requests` ADD COLUMN `concert_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `concert_requests_concert_id_idx` ON `concert_requests`(`concert_id`);

-- AddForeignKey
ALTER TABLE `concert_requests` ADD CONSTRAINT `concert_requests_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `users` MODIFY `marketing_consent` ENUM('YES', 'NO') NOT NULL DEFAULT 'NO';

-- AddForeignKey
ALTER TABLE `concert_info` ADD CONSTRAINT `concert_info_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cultures` ADD CONSTRAINT `cultures_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

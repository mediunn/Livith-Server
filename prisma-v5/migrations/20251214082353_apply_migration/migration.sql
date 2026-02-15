-- DropIndex
DROP INDEX `concert_info_concert_id_fkey` ON `concert_info`;

-- AddForeignKey
ALTER TABLE `concert_info` ADD CONSTRAINT `concert_info_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

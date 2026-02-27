-- AddForeignKey
ALTER TABLE `schedule` ADD CONSTRAINT `schedule_concert_id_fkey` FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

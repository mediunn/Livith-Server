-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_interest_concert_id_fkey` FOREIGN KEY (`interest_concert_id`) REFERENCES `concerts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

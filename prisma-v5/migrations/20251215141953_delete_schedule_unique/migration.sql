-- DropForeignKey
ALTER TABLE `schedule` DROP FOREIGN KEY `schedule_concert_id_fkey`;

-- DropIndex
DROP INDEX `unique_schedule` ON `schedule`;

-- AddForeignKey
-- ALTER TABLE `search_concert_sections` ADD CONSTRAINT `search_concert_sections_search_section_id_fkey` FOREIGN KEY (`search_section_id`) REFERENCES `search_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex
DROP INDEX `concerts_code_key` ON `concerts`;

-- AlterTable
ALTER TABLE `concerts` MODIFY `code` VARCHAR(20) NULL;

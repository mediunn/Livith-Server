/*
  Warnings:

  - The values [KAKAO,APPLE] on the enum `users_provider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `provider` ENUM('kakao', 'apple') NOT NULL;

/*
  Warnings:

  - You are about to alter the column `marketing_consent` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `TinyInt`.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `marketing_consent` BOOLEAN NULL;

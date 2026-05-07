/*
  Warnings:

  - A unique constraint covering the columns `[artist]` on the table `artists` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `artists_artist_key` ON `artists`(`artist`);

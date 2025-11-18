/*
  Warnings:

  - A unique constraint covering the columns `[setlist_id,order_index]` on the table `setlist_songs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `setlist_songs_setlist_id_order_index_key` ON `setlist_songs`(`setlist_id`, `order_index`);

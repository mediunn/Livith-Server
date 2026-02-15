-- CreateIndex
CREATE FULLTEXT INDEX `concerts_title_artist_idx` ON `concerts`(`title`, `artist`);

-- CreateIndex
CREATE INDEX `setlist_songs_setlist_id_song_id_idx` ON `setlist_songs`(`setlist_id`, `song_id`);

-- RenameIndex
ALTER TABLE `carousel_items` RENAME INDEX `carousel_items_carousel_id_fkey` TO `carousel_items_carousel_id_idx`;

-- RenameIndex
ALTER TABLE `cultures` RENAME INDEX `cultures_concert_id_fkey` TO `cultures_concert_id_idx`;

-- RenameIndex
ALTER TABLE `setlists` RENAME INDEX `setlists_concert_id_fkey` TO `setlists_concert_id_idx`;

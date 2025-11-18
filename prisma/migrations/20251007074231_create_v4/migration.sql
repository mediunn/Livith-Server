/*
  Warnings:

  - A unique constraint covering the columns `[artist]` on the table `artists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[concert_id,category]` on the table `concert_info` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `concerts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[concert_id,title]` on the table `cultures` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,artist]` on the table `setlists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,artist]` on the table `songs` will be added. If there are existing duplicate values, this will fail.

*/
-- -- CreateIndex
-- CREATE UNIQUE INDEX `uk_artist` ON `artists`(`artist`);

-- -- CreateIndex
-- CREATE UNIQUE INDEX `uk_concert_category` ON `concert_info`(`concert_id`, `category`);

-- -- CreateIndex
-- CREATE UNIQUE INDEX `uk_title` ON `concerts`(`title`);

-- -- CreateIndex
-- CREATE UNIQUE INDEX `uk_concert_title` ON `cultures`(`concert_id`, `title`(255));

-- -- CreateIndex
-- CREATE UNIQUE INDEX `uk_title_artist` ON `setlists`(`title`, `artist`);

-- -- CreateIndex
-- CREATE UNIQUE INDEX `uk_title_artist` ON `songs`(`title`, `artist`);

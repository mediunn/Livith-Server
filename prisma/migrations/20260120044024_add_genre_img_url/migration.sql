/*
  Warnings:

  - Added the required column `img_url` to the `genres` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `genres` ADD COLUMN `img_url` VARCHAR(2048) NOT NULL;

UPDATE genres SET img_url = 'https://i.imgur.com/YMlRF0K.jpeg' WHERE name = 'ACOUSTIC';
UPDATE genres SET img_url = 'https://i.imgur.com/Odi5v7K.jpeg' WHERE name = 'JPOP';
UPDATE genres SET img_url = 'https://i.imgur.com/0rnKZo2.jpeg' WHERE name = 'RAP_HIPHOP';
UPDATE genres SET img_url = 'https://i.imgur.com/UBxSeqS.jpeg' WHERE name = 'ELECTRONIC';
UPDATE genres SET img_url = 'https://i.imgur.com/uCkAExC.jpeg' WHERE name = 'ROCK_METAL';
UPDATE genres SET img_url = 'https://i.imgur.com/DsmIq5O.jpeg' WHERE name = 'CLASSIC_JAZZ';
ALTER TABLE `user_interest_concerts`
  ADD COLUMN `toast_shown` BOOLEAN NOT NULL DEFAULT false AFTER `user_nickname`;

-- fcm_tokens에 unique 제약 추가
ALTER TABLE `fcm_tokens` ADD UNIQUE INDEX `fcm_tokens_user_id_token_key`(`user_id`, `token`);
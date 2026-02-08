-- 콘서트: id 1600 "마이 케미컬 로맨스 내한공연" — 모든 유저에게 없는 type만 11종 추가 (target_id = 1600)
-- 기존 알림은 그대로 두고, (user_id, type) 조합이 없을 때만 INSERT → 중복 없음
-- 실행: MySQL 8.0+

INSERT INTO notificationhistories (user_id, type, title, content, target_id, is_read, created_at)
SELECT u.id, 'INTEREST_CONCERT', '관심 콘서트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매 시작과 셋리스트 업데이트 소식을 가장 먼저 알려드려요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'INTEREST_CONCERT')
UNION ALL
SELECT u.id, 'TICKET_7D', '예매 일정', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매가 7일 뒤에 시작해요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'TICKET_7D')
UNION ALL
SELECT u.id, 'TICKET_1D', '예매 일정', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매가 내일 시작해요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'TICKET_1D')
UNION ALL
SELECT u.id, 'TICKET_TODAY', '예매 일정', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매가 오늘 오후 8시에 시작해요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'TICKET_TODAY')
UNION ALL
SELECT u.id, 'CONCERT_INFO_UPDATE_SETLIST', '콘서트 정보 업데이트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 공연의 예상 셋리스트가 등록 됐어요. 콘서트 가기 전까지 주요 노래를 익혀보아요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'CONCERT_INFO_UPDATE_SETLIST')
UNION ALL
SELECT u.id, 'CONCERT_INFO_UPDATE_MD', '콘서트 정보 업데이트', '기다리던 마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)의 공식 굿즈 라인업이 공개 됐어요! 어떤 아이템들이 있는지 지금 바로 확인해보아요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'CONCERT_INFO_UPDATE_MD')
UNION ALL
SELECT u.id, 'CONCERT_INFO_UPDATE_DETAIL', '콘서트 정보 업데이트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)의 새로운 소식이 도착했어요! 공연을 더 풍성하게 즐길 수 있는 추가 안내 사항을 지금 확인해 보세요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'CONCERT_INFO_UPDATE_DETAIL')
UNION ALL
SELECT u.id, 'CONCERT_INFO_UPDATE_SCHEDULE', '콘서트 정보 업데이트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)의 일정이 업데이트 되었어요! 소중한 관람 기회를 놓치지 않도록 일정을 꼭 체크해 주세요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'CONCERT_INFO_UPDATE_SCHEDULE')
UNION ALL
SELECT u.id, 'CONCERT_INFO_UPDATE_TICKET', '콘서트 정보 업데이트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 티켓 예매 정보가 업데이트 됐어요! 티켓팅 성공을 위해 상세 내용을 미리 확인해 보세요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'CONCERT_INFO_UPDATE_TICKET')
UNION ALL
SELECT u.id, 'ARTIST_CONCERT_OPEN', '아티스트 콘서트 오픈', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 콘서트가 등록되었어요!', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'ARTIST_CONCERT_OPEN')
UNION ALL
SELECT u.id, 'RECOMMEND', '추천 콘서트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)을 추천해 드려요! 지금 확인해 보세요.', '1600', 0, NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id AND nh.type = 'RECOMMEND');

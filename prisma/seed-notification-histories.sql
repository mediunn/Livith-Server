-- 콘서트: id 1600 "마이 케미컬 로맨스 내한공연" — 메시지·target_id 전부 이 공연 기준
-- 알림 목록에서 눌렀을 때 해당 콘서트 상세로 이동 (target_id = 1600)
-- 실행: MySQL 8.0+ (DELETE → UPDATE → INSERT)

-- 0) content가 '관심 콘서트의 좌석 배치도가 공개되었습니다.' 인 알림 삭제
DELETE FROM notificationhistories WHERE content = '관심 콘서트의 좌석 배치도가 공개되었습니다.';

-- 1) 기존 알림 히스토리 전부 동일 콘서트(1600) + 메시지로 업데이트
UPDATE notificationhistories SET target_id = '1600', title = '관심 콘서트', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매 시작과 셋리스트 업데이트 소식을 가장 먼저 알려드려요!' WHERE type = 'INTEREST_CONCERT';
UPDATE notificationhistories SET target_id = '1600', title = '예매 일정', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매가 7일 뒤에 시작해요!' WHERE type = 'TICKET_7D';
UPDATE notificationhistories SET target_id = '1600', title = '예매 일정', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매가 내일 시작해요!' WHERE type = 'TICKET_1D';
UPDATE notificationhistories SET target_id = '1600', title = '예매 일정', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매가 오늘 오후 8시에 시작해요!' WHERE type = 'TICKET_TODAY';
UPDATE notificationhistories SET target_id = '1600', title = '콘서트 정보 업데이트', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 공연의 예상 셋리스트가 등록 됐어요. 콘서트 가기 전까지 주요 노래를 익혀보아요!' WHERE type = 'CONCERT_INFO_UPDATE_SETLIST';
UPDATE notificationhistories SET target_id = '1600', title = '콘서트 정보 업데이트', content = '기다리던 마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)의 공식 굿즈 라인업이 공개 됐어요! 어떤 아이템들이 있는지 지금 바로 확인해보아요!' WHERE type = 'CONCERT_INFO_UPDATE_MD';
UPDATE notificationhistories SET target_id = '1600', title = '콘서트 정보 업데이트', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)의 새로운 소식이 도착했어요! 공연을 더 풍성하게 즐길 수 있는 추가 안내 사항을 지금 확인해 보세요!' WHERE type = 'CONCERT_INFO_UPDATE_DETAIL';
UPDATE notificationhistories SET target_id = '1600', title = '콘서트 정보 업데이트', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)의 일정이 업데이트 되었어요! 소중한 관람 기회를 놓치지 않도록 일정을 꼭 체크해 주세요!' WHERE type = 'CONCERT_INFO_UPDATE_SCHEDULE';
UPDATE notificationhistories SET target_id = '1600', title = '콘서트 정보 업데이트', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 티켓 예매 정보가 업데이트 됐어요! 티켓팅 성공을 위해 상세 내용을 미리 확인해 보세요!' WHERE type = 'CONCERT_INFO_UPDATE_TICKET';
UPDATE notificationhistories SET target_id = '1600', title = '아티스트 콘서트 오픈', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 콘서트가 등록되었어요!' WHERE type = 'ARTIST_CONCERT_OPEN';
UPDATE notificationhistories SET target_id = '1600', title = '추천 콘서트', content = '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)을 추천해 드려요! 지금 확인해 보세요.' WHERE type = 'RECOMMEND';

-- 2) 알림 히스토리가 없는 유저에게만, 11종 중 랜덤 4개씩 삽입
INSERT INTO notificationhistories (user_id, type, title, content, target_id, is_read, created_at)
SELECT user_id, type, title, content, target_id, is_read, created_at
FROM (
  SELECT user_id, type, title, content, target_id, is_read, created_at,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY RAND()) AS rn
  FROM (
    SELECT u.id AS user_id, 'INTEREST_CONCERT' AS type, '관심 콘서트' AS title, '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매 시작과 셋리스트 업데이트 소식을 가장 먼저 알려드려요!' AS content, '1600' AS target_id, 0 AS is_read, NOW() AS created_at
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'TICKET_7D', '예매 일정', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매가 7일 뒤에 시작해요!', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'TICKET_1D', '예매 일정', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매가 내일 시작해요!', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'TICKET_TODAY', '예매 일정', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 예매가 오늘 오후 8시에 시작해요!', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'CONCERT_INFO_UPDATE_SETLIST', '콘서트 정보 업데이트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 공연의 예상 셋리스트가 등록 됐어요. 콘서트 가기 전까지 주요 노래를 익혀보아요!', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'CONCERT_INFO_UPDATE_MD', '콘서트 정보 업데이트', '기다리던 마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)의 공식 굿즈 라인업이 공개 됐어요! 어떤 아이템들이 있는지 지금 바로 확인해보아요!', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'CONCERT_INFO_UPDATE_DETAIL', '콘서트 정보 업데이트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)의 새로운 소식이 도착했어요! 공연을 더 풍성하게 즐길 수 있는 추가 안내 사항을 지금 확인해 보세요!', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'CONCERT_INFO_UPDATE_SCHEDULE', '콘서트 정보 업데이트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)의 일정이 업데이트 되었어요! 소중한 관람 기회를 놓치지 않도록 일정을 꼭 체크해 주세요!', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'CONCERT_INFO_UPDATE_TICKET', '콘서트 정보 업데이트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 티켓 예매 정보가 업데이트 됐어요! 티켓팅 성공을 위해 상세 내용을 미리 확인해 보세요!', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'ARTIST_CONCERT_OPEN', '아티스트 콘서트 오픈', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea) 콘서트가 등록되었어요!', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
    UNION ALL
    SELECT u.id, 'RECOMMEND', '추천 콘서트', '마이 케미컬 로맨스 내한공연 (My Chemical Romance Live in Korea)을 추천해 드려요! 지금 확인해 보세요.', '1600', 0, NOW()
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM notificationhistories nh WHERE nh.user_id = u.id)
  ) t1
) t2
WHERE rn <= 4;

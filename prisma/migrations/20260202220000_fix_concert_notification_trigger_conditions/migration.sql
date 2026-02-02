-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS after_concert_update;
DROP TRIGGER IF EXISTS after_concert_update_ticket;

-- 트리거 1: 콘서트 상세 정보 업데이트 알림(티켓 정보 제외)
-- 티켓 정보(ticket_site, ticket_url)는 그대로이고, 다른 필드가 변경되었을 때 실행
CREATE TRIGGER after_concert_update
AFTER UPDATE ON concerts
FOR EACH ROW
BEGIN
    IF (OLD.ticket_site <=> NEW.ticket_site AND OLD.ticket_url <=> NEW.ticket_url)
        AND NOT (OLD.title <=> NEW.title
                AND OLD.venue <=> NEW.venue
                AND OLD.start_date <=> NEW.start_date
                AND OLD.end_date <=> NEW.end_date
                AND OLD.poster <=> NEW.poster
                AND OLD.artist <=> NEW.artist
                AND OLD.status <=> NEW.status) THEN
        INSERT INTO concert_notification_queue (concert_id, event_type, processed)
        VALUES (NEW.id, 'CONCERT_INFO_UPDATE_CONCERT_DETAIL', 0);
    END IF;
END;


-- 트리거 2: 티켓 정보 업데이트 알림 (ticket_site 또는 ticket_url 변경 시)
CREATE TRIGGER after_concert_update_ticket
AFTER UPDATE ON concerts
FOR EACH ROW
BEGIN
  IF NOT (OLD.ticket_site <=> NEW.ticket_site AND OLD.ticket_url <=> NEW.ticket_url) THEN
    INSERT INTO concert_notification_queue (concert_id, event_type, processed)
    VALUES (NEW.id, 'CONCERT_INFO_UPDATE_TICKET', 0);
  END IF;
END;
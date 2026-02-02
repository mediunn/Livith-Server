// concert INSERT 시: 아티스트 콘서트 오픈 알림 큐에 적재
DELIMITER //
CREATE TRIGGER after_concert_insert
AFTER INSERT ON concerts
FOR EACH ROW
BEGIN
  INSERT INTO concert_notification_queue (concert_id, event_type, processed)
  VALUES (NEW.id, 'ARTIST_CONCERT_OPEN', 0);
END//
DELIMITER ;

-- concerts UPDATE 시: 콘서트 상세 정보 업데이트 알림 큐에 적재 (티켓 정보 제외)
DELIMITER //
CREATE TRIGGER after_concert_update
AFTER UPDATE ON concerts
FOR EACH ROW
BEGIN
  IF (OLD.ticket_site = NEW.ticket_site AND OLD.ticket_url = NEW.ticket_url) THEN
    INSERT INTO concert_notification_queue (concert_id, event_type, processed)
    VALUES (NEW.id, 'CONCERT_INFO_UPDATE_CONCERT_DETAIL', 0);
  END IF;
END//
DELIMITER ;

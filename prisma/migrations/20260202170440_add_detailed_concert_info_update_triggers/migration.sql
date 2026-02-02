-- ConcertSetlist INSERT/UPDATE 시: 셋리스트 업데이트 알림 큐에 적재
CREATE TRIGGER after_concert_setlist_insert
AFTER INSERT ON concert_setlists
FOR EACH ROW
BEGIN
  INSERT INTO concert_notification_queue (concert_id, event_type, processed)
  VALUES (NEW.concert_id, 'CONCERT_INFO_UPDATE_SETLIST', 0);
END;


CREATE TRIGGER after_concert_setlist_update
AFTER UPDATE ON concert_setlists
FOR EACH ROW
BEGIN
  INSERT INTO concert_notification_queue (concert_id, event_type, processed)
  VALUES (NEW.concert_id, 'CONCERT_INFO_UPDATE_SETLIST', 0);
END;

-- Md (굿즈) INSERT/UPDATE 시: MD 정보 업데이트 알림 큐에 적재
CREATE TRIGGER after_md_insert
AFTER INSERT ON md
FOR EACH ROW
BEGIN
  INSERT INTO concert_notification_queue (concert_id, event_type, processed)
  VALUES (NEW.concert_id, 'CONCERT_INFO_UPDATE_MD_INFO', 0);
END;

CREATE TRIGGER after_md_update
AFTER UPDATE ON md
FOR EACH ROW
BEGIN
  INSERT INTO concert_notification_queue (concert_id, event_type, processed)
  VALUES (NEW.concert_id, 'CONCERT_INFO_UPDATE_MD_INFO', 0);
END;

-- Schedule UPDATE 시: 일정 업데이트 알림 큐에 적재 (INSERT는 예매 일정 스케줄러가 처리)

CREATE TRIGGER after_schedule_update
AFTER UPDATE ON schedule
FOR EACH ROW
BEGIN
  INSERT INTO concert_notification_queue (concert_id, event_type, processed)
  VALUES (NEW.concert_id, 'CONCERT_INFO_UPDATE_SCHEDULE', 0);
END;


-- concerts UPDATE 시: 티켓 정보 업데이트 알림 큐에 적재 (ticketSite, ticketUrl 변경 감지)
CREATE TRIGGER after_concert_update_ticket
AFTER UPDATE ON concerts
FOR EACH ROW
BEGIN
  IF (OLD.ticket_site <=> NEW.ticket_site AND OLD.ticket_url <=> NEW.ticket_url) THEN
    INSERT INTO concert_notification_queue (concert_id, event_type, processed)
    VALUES (NEW.id, 'CONCERT_INFO_UPDATE_TICKET', 0);
  END IF;
END;

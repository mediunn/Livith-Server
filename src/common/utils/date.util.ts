const MS_PER_DAY = 1000 * 60 * 60 * 24;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function parseYmd(
  dateStr: string,
): { year: number; month: number; day: number } | null {
  const match = dateStr.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  )
    return null;

  return { year, month, day };
}

function getTodayKstYmd(): { year: number; month: number; day: number } {
  const kst = new Date(Date.now() + KST_OFFSET_MS);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
  };
}

export function getDaysUntil(dateStr: string): number {
  const target = parseYmd(dateStr);
  if (!target) return 0;

  const today = getTodayKstYmd();
  const targetUtcMs = Date.UTC(target.year, target.month - 1, target.day);
  const todayUtcMs = Date.UTC(today.year, today.month - 1, today.day);

  return Math.trunc((targetUtcMs - todayUtcMs) / MS_PER_DAY);
}

/**
 * 한국 시간 (KST) 기준 21시 ~ 08시(야간) 여부
 * @param date 기준 시각
 */
export function isNightTimeKst(date?: Date): boolean {
  const base = date ? date.getTime() : Date.now();
  const kst = new Date(base + KST_OFFSET_MS);
  const hour = kst.getUTCHours();
  return hour >= 21 || hour < 8;
}

/**
 * KST 기준 "오늘 + daysfromToday" 일자의 UTC 시각 범위
 * DB의 scheduledAt 범위 조회
 */
export function getKstDayRange(daysfromToday: number): {
  start: Date;
  end: Date;
} {
  const today = getTodayKstYmd();
  const startOfDayKst =
    Date.UTC(today.year, today.month - 1, today.day) +
    daysfromToday * MS_PER_DAY -
    KST_OFFSET_MS;

  return {
    start: new Date(startOfDayKst),
    end: new Date(startOfDayKst + MS_PER_DAY - 1),
  };
}

/**
 * Date를 KST 기준 "N시" 문자열로
 */
export function formatKstHour(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return `${kst.getUTCHours()}시`;
}

/**
 * "20시" → "오후 8시" 변환
 */
export function formatHourAmPm(hourStr: string): string {
  const hour = parseInt(hourStr);
  if (isNaN(hour)) return hourStr;
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${displayHour}시`;
}

/**
 * Date를 KST 기준 "YYYY.MM.DD HH:mm" 형식으로
 */
export function formatKstDateTime(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${kst.getUTCFullYear()}.${pad(kst.getUTCMonth() + 1)}.${pad(kst.getUTCDate())} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`;
}


/**
 * 콘서트 D-day 계산(다일 공연)
 */
export function getConcertDaysLeft(startDate: string, endDate: string): number{
  const today = getTodayKstYmd();
  const todayUtcMs = Date.UTC(today.year, today.month - 1, today.day);
  const start = parseYmd(startDate);
  const end = parseYmd(endDate);
  if(!start || !end) return 0;
  const startUtcMs = Date.UTC(start.year, start.month - 1, start.day);
  const endUtcMs = Date.UTC(end.year, end.month - 1, end.day);
  if(todayUtcMs >= startUtcMs && todayUtcMs <= endUtcMs) return 0;
  return Math.trunc((startUtcMs - todayUtcMs) / MS_PER_DAY);
}
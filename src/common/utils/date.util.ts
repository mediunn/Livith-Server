const MS_PER_DAY = 1000 * 60 * 60 * 24;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

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

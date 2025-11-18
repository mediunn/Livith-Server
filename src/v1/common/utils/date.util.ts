export function getDaysUntil(dateStr: string): number {
  const [year, month, day] = dateStr.split('.').map(Number);
  const targetDate = new Date(year, month - 1, day); // JS에서 month는 0부터 시작
  const today = new Date();

  // 시간은 무시하고 날짜만 비교하기 위해 시,분,초,ms를 0으로 맞춤
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 밀리초 → 일 수

  return diffDays;
}

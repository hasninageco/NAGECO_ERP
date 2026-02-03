import type { DayKey, TimesheetApiRow, TimesheetDayValue } from './types';

export function getDaysInMonth(year: number, month1to12: number): number {
  // month is 1-12
  return new Date(year, month1to12, 0).getDate();
}

export function dayKey(day: number): DayKey {
  if (day < 1 || day > 31) throw new Error('day must be between 1 and 31');
  return `j_${day}` as DayKey;
}

export function normalizeDayValue(value: unknown): TimesheetDayValue {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  return v.length === 0 ? null : v;
}

export function countMarker(row: TimesheetApiRow, marker: string, daysInMonth: number): number {
  let count = 0;
  const m = marker.toUpperCase();
  for (let d = 1; d <= daysInMonth; d++) {
    const v = (row[dayKey(d)] ?? '').toString().toUpperCase();
    if (v === m) count++;
  }
  return count;
}

export function cellClassForMarker(value: TimesheetDayValue): string {
  const v = (value ?? '').toString().trim().toUpperCase();
  switch (v) {
    case 'H':
      return 'ts-cell-h';
    case 'A':
      return 'ts-cell-a';
    case 'P':
      return 'ts-cell-p';
    case 'V':
      return 'ts-cell-v';
    case 'B':
      return 'ts-cell-b';
    case 'TD':
      return 'ts-cell-td';
    default:
      return '';
  }
}

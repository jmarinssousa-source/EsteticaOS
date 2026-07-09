export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function addMonths(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
}

/** Monday-based start of week. */
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(result, diff);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

/** 6 weeks x 7 days (Mon–Sun), including leading/trailing days from
 * neighboring months, so the month grid always renders a full 6-row
 * layout regardless of which weekday the month starts on. */
export function buildMonthGrid(anchor: Date): Date[][] {
  const gridStart = startOfWeek(startOfMonth(anchor));
  const weeks: Date[][] = [];
  let cursor = gridStart;
  for (let week = 0; week < 6; week++) {
    const days: Date[] = [];
    for (let day = 0; day < 7; day++) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(days);
  }
  return weeks;
}

const WEEKDAY_SHORT = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const DAY_LONG = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const MONTH_TITLE = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const DAY_SHORT_TITLE = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });

export function formatWeekdayShort(date: Date): string {
  const label = WEEKDAY_SHORT.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

export function formatDayLong(date: Date): string {
  const label = DAY_LONG.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatMonthTitle(date: Date): string {
  const label = MONTH_TITLE.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDayShortTitle(date: Date): string {
  return DAY_SHORT_TITLE.format(date);
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

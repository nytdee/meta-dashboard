export type FormatOptions = {
  dec?: number;
  prefix?: string;
  suffix?: string;
};

export function fmt(
  value: number | null | undefined,
  { dec = 0, prefix = "", suffix = "" }: FormatOptions = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const formatted =
    dec > 0
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        })
      : Math.round(value).toLocaleString("en-US");
  return `${prefix}${formatted}${suffix}`;
}

export function money(value: number | null | undefined, dec = 0): string {
  return fmt(value, { dec, prefix: "₹" });
}

export function percent(value: number | null | undefined, dec = 2): string {
  return fmt(value, { dec, suffix: "%" });
}

export function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function addDays(iso: string, days: number): string {
  const date = parseDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfPreviousMonth(iso: string): string {
  return addDays(startOfMonth(iso), -1);
}

export function startOfPreviousMonth(iso: string): string {
  return startOfMonth(endOfPreviousMonth(iso));
}

export function formatShort(iso: string): string {
  return parseDate(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatRange(from: string, to: string): string {
  return from === to ? formatShort(from) : `${formatShort(from)} – ${formatShort(to)}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function deltaPercent(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    Number.isNaN(current) ||
    Number.isNaN(previous) ||
    previous === 0
  ) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function isImprovement(change: number, invert = false): boolean {
  return invert ? change < 0 : change > 0;
}

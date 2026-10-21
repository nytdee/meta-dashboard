import {
  addDays,
  endOfPreviousMonth,
  startOfMonth,
  startOfPreviousMonth,
} from "./format";
import type { PresetKey } from "./types";

export function normalizeRange(from: string, to: string) {
  return from <= to ? { from, to } : { from: to, to: from };
}

export function rangeForPreset(preset: PresetKey, maxDate: string) {
  switch (preset) {
    case "Today":
      return { from: maxDate, to: maxDate };
    case "Yesterday": {
      const day = addDays(maxDate, -1);
      return { from: day, to: day };
    }
    case "Last 7 days":
      return { from: addDays(maxDate, -6), to: maxDate };
    case "Last 14 days":
      return { from: addDays(maxDate, -13), to: maxDate };
    case "Last 30 days":
      return { from: addDays(maxDate, -29), to: maxDate };
    case "This month":
      return { from: startOfMonth(maxDate), to: maxDate };
    case "Last month":
      return {
        from: startOfPreviousMonth(maxDate),
        to: endOfPreviousMonth(maxDate),
      };
  }
}

import type { RecurrenceFrequency } from "./types";

interface RecurrenceParams {
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate?: string | null;
  maxOccurrences?: number | null;
}

const DEFAULT_HORIZON_WEEKS = 12;

/**
 * Generates booking dates for a recurrence rule.
 *
 * Materialises dates up to the given horizon or until end conditions are met.
 * Returns an array of "YYYY-MM-DD" date strings.
 */
export function generateRecurrenceDates(
  params: RecurrenceParams,
  horizonWeeks: number = DEFAULT_HORIZON_WEEKS
): string[] {
  const { frequency, interval, startDate, endDate, maxOccurrences } = params;

  const dates: string[] = [];
  const start = parseDate(startDate);
  const horizon = new Date(start);
  horizon.setDate(horizon.getDate() + horizonWeeks * 7);

  const effectiveEnd = endDate ? parseDate(endDate) : horizon;
  const limit = Math.min(
    effectiveEnd.getTime(),
    horizon.getTime()
  );

  let current = new Date(start);
  let count = 0;

  while (current.getTime() <= limit) {
    if (maxOccurrences && count >= maxOccurrences) break;

    dates.push(formatDate(current));
    count++;

    // Advance to next occurrence
    current = advanceDate(current, frequency, interval);
  }

  return dates;
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00Z");
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function advanceDate(
  date: Date,
  frequency: RecurrenceFrequency,
  interval: number
): Date {
  const next = new Date(date);

  switch (frequency) {
    case "daily":
      next.setUTCDate(next.getUTCDate() + interval);
      break;
    case "weekly":
      next.setUTCDate(next.getUTCDate() + 7 * interval);
      break;
    case "fortnightly":
      next.setUTCDate(next.getUTCDate() + 14 * interval);
      break;
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + interval);
      break;
  }

  return next;
}

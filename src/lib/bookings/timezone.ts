const UK_TIMEZONE = "Europe/London";

const ukDateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const ukTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Returns whether a given date falls in BST (British Summer Time).
 * BST runs from the last Sunday in March at 01:00 UTC
 * to the last Sunday in October at 01:00 UTC.
 */
export function isBST(date: Date): boolean {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value;

  // BST = "BST", GMT = "GMT"
  return tzName === "BST";
}

/**
 * Gets the current date in UK local time as "YYYY-MM-DD".
 */
export function getCurrentUKDate(): string {
  return formatUKDate(new Date());
}

/**
 * Gets the current time in UK local time as "HH:MM".
 */
export function getCurrentUKTime(): string {
  return formatUKTime(new Date());
}

/**
 * Formats a Date object as a UK local date string "YYYY-MM-DD".
 */
export function formatUKDate(date: Date): string {
  const parts = ukDateFormat.formatToParts(date);
  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const year = parts.find((p) => p.type === "year")?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object as a UK local time string "HH:MM".
 */
export function formatUKTime(date: Date): string {
  const parts = ukTimeFormat.formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  return `${hour}:${minute}`;
}

/**
 * Converts a UK local date+time to a UTC Date object.
 * Useful for Phase 7 (calendar sync) and comparison with JS Date.
 */
export function ukLocalToUTC(date: string, time: string): Date {
  // Create a date string that we interpret as UK local time
  const isoString = `${date}T${time}:00`;

  // Use a trick: create the date in UTC, then adjust for UK offset
  const utcDate = new Date(isoString + "Z");

  // Determine the offset for this specific date/time in UK timezone
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Format the UTC date as if it were in UK timezone
  const ukParts = formatter.formatToParts(utcDate);
  const ukHour = parseInt(
    ukParts.find((p) => p.type === "hour")?.value ?? "0",
    10
  );
  const inputHour = parseInt(time.split(":")[0], 10);

  // The difference tells us the offset
  const offsetHours = ukHour - inputHour;

  // Adjust: if UK shows a different hour than we input,
  // we need to shift by the offset to get the correct UTC
  const result = new Date(isoString + "Z");
  result.setUTCHours(result.getUTCHours() - offsetHours);

  return result;
}

/**
 * Converts a UTC Date object to UK local date and time strings.
 */
export function utcToUKLocal(utcDate: Date): { date: string; time: string } {
  return {
    date: formatUKDate(utcDate),
    time: formatUKTime(utcDate),
  };
}

/**
 * Parses a "YYYY-MM-DD" date string and returns the ISO day of week.
 * 0 = Monday, 6 = Sunday (ISO 8601).
 */
export function getISODayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + "T12:00:00Z"); // noon UTC to avoid DST issues
  const jsDay = date.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // Convert to ISO: 0=Mon, 6=Sun
}

/**
 * Compares two "HH:MM" time strings.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareTime(a: string, b: string): number {
  const [aH, aM] = a.split(":").map(Number);
  const [bH, bM] = b.split(":").map(Number);
  return aH * 60 + aM - (bH * 60 + bM);
}

/**
 * Adds minutes to a "HH:MM" time string.
 * Returns the new "HH:MM" string.
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/**
 * Converts a "HH:MM" time string to total minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

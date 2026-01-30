import db from "@/lib/db";
import type { UkPublicHoliday, HolidayRegion } from "./types";

/**
 * Checks if a given date is a UK public holiday.
 */
export async function isPublicHoliday(
  date: string,
  region?: HolidayRegion
): Promise<{ isHoliday: boolean; name: string | null }> {
  const query = db("uk_public_holidays").where("date", date);

  if (region && region !== "all") {
    query.where(function () {
      this.where("region", region).orWhere("region", "all");
    });
  }

  const holiday = await query.first<UkPublicHoliday | undefined>();

  return {
    isHoliday: !!holiday,
    name: holiday?.name ?? null,
  };
}

/**
 * Gets all public holidays in a date range.
 */
export async function getPublicHolidays(
  startDate: string,
  endDate: string,
  region?: HolidayRegion
): Promise<UkPublicHoliday[]> {
  const query = db("uk_public_holidays")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .orderBy("date", "asc");

  if (region && region !== "all") {
    query.where(function () {
      this.where("region", region).orWhere("region", "all");
    });
  }

  return query;
}

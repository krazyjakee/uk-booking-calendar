import db from "@/lib/db";
import type {
  AvailabilitySlot,
  Booking,
  TradesmanProfile,
  WorkingHours,
} from "./types";
import { isPublicHoliday } from "./holidays";
import {
  getISODayOfWeek,
  timeToMinutes,
  addMinutesToTime,
} from "./timezone";

/**
 * Gets available 1-hour slots for a tradesman on a given date.
 *
 * Process:
 * 1. Fetch tradesman's working hours for that day of week
 * 2. Check if the date is a UK public holiday
 * 3. Fetch existing active bookings for that tradesman on that date
 * 4. Apply buffer time between bookings
 * 5. Return array of available time slots
 */
export async function getAvailableSlots(
  tradesmanId: string,
  date: string,
  durationMinutes: number = 60
): Promise<{
  slots: AvailabilitySlot[];
  isHoliday: boolean;
  holidayName: string | null;
}> {
  const dayOfWeek = getISODayOfWeek(date);

  // 1. Get working hours for this day
  const workingHours = await db("working_hours")
    .where("tradesman_id", tradesmanId)
    .where("day_of_week", dayOfWeek)
    .where("is_active", true)
    .orderBy("start_time", "asc") as WorkingHours[];

  // 2. Check public holiday
  const holiday = await isPublicHoliday(date);

  // No working hours or public holiday = no availability
  if (workingHours.length === 0 || holiday.isHoliday) {
    return {
      slots: [],
      isHoliday: holiday.isHoliday,
      holidayName: holiday.name,
    };
  }

  // 3. Fetch existing active bookings (exclude cancelled/no-show)
  const existingBookings = await db("bookings")
    .where("tradesman_id", tradesmanId)
    .where("date", date)
    .whereNotIn("status", ["cancelled", "no-show"])
    .orderBy("start_time", "asc") as Booking[];

  // 4. Get buffer time
  const profile = await db("tradesman_profiles")
    .where("user_id", tradesmanId)
    .first<TradesmanProfile | undefined>();
  const bufferMinutes = profile?.buffer_minutes ?? 0;

  // 5. Generate candidate slots and check availability
  const slots: AvailabilitySlot[] = [];

  for (const period of workingHours) {
    const periodStartMinutes = timeToMinutes(period.start_time);
    const periodEndMinutes = timeToMinutes(period.end_time);

    // Generate slots on the hour within this working period
    let slotStart = periodStartMinutes;
    while (slotStart + durationMinutes <= periodEndMinutes) {
      const slotEnd = slotStart + durationMinutes;
      const startTimeStr = addMinutesToTime("00:00", slotStart);
      const endTimeStr = addMinutesToTime("00:00", slotEnd);

      // Check if this slot overlaps with any existing booking (including buffer)
      const isAvailable = !existingBookings.some((booking) => {
        const bookingStart = timeToMinutes(booking.start_time);
        const bookingEnd = timeToMinutes(booking.end_time) + bufferMinutes;

        // Overlap check: slot overlaps if it starts before booking ends
        // and ends after booking starts
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });

      slots.push({
        start_time: startTimeStr,
        end_time: endTimeStr,
        available: isAvailable,
      });

      slotStart += 60; // Move to next hour
    }
  }

  return {
    slots,
    isHoliday: holiday.isHoliday,
    holidayName: holiday.name,
  };
}

/**
 * Checks if a specific time slot is available for a tradesman.
 * Used before creating/updating a booking to prevent double-booking.
 */
export async function isSlotAvailable(
  tradesmanId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<boolean> {
  const slotStart = timeToMinutes(startTime);
  const slotEnd = timeToMinutes(endTime);

  // Get buffer time
  const profile = await db("tradesman_profiles")
    .where("user_id", tradesmanId)
    .first<TradesmanProfile | undefined>();
  const bufferMinutes = profile?.buffer_minutes ?? 0;

  // Check for overlapping active bookings
  const query = db("bookings")
    .where("tradesman_id", tradesmanId)
    .where("date", date)
    .whereNotIn("status", ["cancelled", "no-show"]);

  if (excludeBookingId) {
    query.whereNot("id", excludeBookingId);
  }

  const existingBookings = (await query) as Booking[];

  return !existingBookings.some((booking) => {
    const bookingStart = timeToMinutes(booking.start_time);
    const bookingEnd = timeToMinutes(booking.end_time) + bufferMinutes;

    return slotStart < bookingEnd && slotEnd > bookingStart;
  });
}

/**
 * Validates that a time slot falls within the tradesman's working hours
 * for the given date's day of the week.
 */
export async function isWithinWorkingHours(
  tradesmanId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const dayOfWeek = getISODayOfWeek(date);
  const slotStart = timeToMinutes(startTime);
  const slotEnd = timeToMinutes(endTime);

  const workingHours = await db("working_hours")
    .where("tradesman_id", tradesmanId)
    .where("day_of_week", dayOfWeek)
    .where("is_active", true) as WorkingHours[];

  // The slot must fit entirely within at least one working period
  return workingHours.some((period) => {
    const periodStart = timeToMinutes(period.start_time);
    const periodEnd = timeToMinutes(period.end_time);
    return slotStart >= periodStart && slotEnd <= periodEnd;
  });
}

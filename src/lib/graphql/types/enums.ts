import builder from "../builder";
import type { BookingStatus, RecurrenceFrequency, HolidayRegion } from "@/lib/bookings/types";

// GraphQL enum values must be valid identifiers (no hyphens).
// We map between GraphQL values and database values.

export const bookingStatusMap: Record<string, BookingStatus> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
};

export const bookingStatusReverseMap: Record<BookingStatus, string> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  "in-progress": "IN_PROGRESS",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  "no-show": "NO_SHOW",
};

export const BookingStatusEnum = builder.enumType("BookingStatus", {
  values: [
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ] as const,
});

export const recurrenceFrequencyMap: Record<string, RecurrenceFrequency> = {
  DAILY: "daily",
  WEEKLY: "weekly",
  FORTNIGHTLY: "fortnightly",
  MONTHLY: "monthly",
};

export const RecurrenceFrequencyEnum = builder.enumType("RecurrenceFrequency", {
  values: ["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"] as const,
});

export const holidayRegionMap: Record<string, HolidayRegion> = {
  ENGLAND_AND_WALES: "england-and-wales",
  SCOTLAND: "scotland",
  NORTHERN_IRELAND: "northern-ireland",
  ALL: "all",
};

export const HolidayRegionEnum = builder.enumType("HolidayRegion", {
  values: [
    "ENGLAND_AND_WALES",
    "SCOTLAND",
    "NORTHERN_IRELAND",
    "ALL",
  ] as const,
});

import { BOOKING_STATUSES, RECURRENCE_FREQUENCIES } from "./types";
import type { BookingStatus, RecurrenceFrequency } from "./types";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

export function validateDate(date: unknown): string | null {
  if (typeof date !== "string" || !date) {
    return "Date is required.";
  }
  if (!DATE_REGEX.test(date)) {
    return "Date must be in YYYY-MM-DD format.";
  }
  const parsed = new Date(date + "T12:00:00Z");
  if (isNaN(parsed.getTime())) {
    return "Date is not valid.";
  }
  return null;
}

export function validateFutureDate(date: string, currentDate: string): string | null {
  if (date < currentDate) {
    return "Date must not be in the past.";
  }
  return null;
}

export function validateTime(time: unknown): string | null {
  if (typeof time !== "string" || !time) {
    return "Time is required.";
  }
  if (!TIME_REGEX.test(time)) {
    return "Time must be in HH:MM format.";
  }
  const [hours, minutes] = time.split(":").map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return "Time is not valid.";
  }
  return null;
}

export function validateHourBoundary(time: string): string | null {
  const minutes = parseInt(time.split(":")[1], 10);
  if (minutes !== 0) {
    return "Time must be on the hour (e.g. 09:00, 10:00).";
  }
  return null;
}

export function validateDuration(duration: unknown): string | null {
  if (typeof duration !== "number" || !Number.isInteger(duration)) {
    return "Duration must be a whole number.";
  }
  if (duration <= 0) {
    return "Duration must be positive.";
  }
  if (duration % 60 !== 0) {
    return "Duration must be a multiple of 60 minutes.";
  }
  return null;
}

export function validateBookingStatus(status: unknown): string | null {
  if (typeof status !== "string" || !status) {
    return "Status is required.";
  }
  if (!BOOKING_STATUSES.includes(status as BookingStatus)) {
    return `Status must be one of: ${BOOKING_STATUSES.join(", ")}.`;
  }
  return null;
}

export function validateRecurrenceFrequency(frequency: unknown): string | null {
  if (typeof frequency !== "string" || !frequency) {
    return "Frequency is required.";
  }
  if (!RECURRENCE_FREQUENCIES.includes(frequency as RecurrenceFrequency)) {
    return `Frequency must be one of: ${RECURRENCE_FREQUENCIES.join(", ")}.`;
  }
  return null;
}

export function validateUUID(value: unknown, fieldName: string): string | null {
  if (typeof value !== "string" || !value) {
    return `${fieldName} is required.`;
  }
  return null;
}

export function validateCustomerEmail(email: unknown): string | null {
  if (typeof email !== "string" || !email.trim()) {
    return "Customer email is required.";
  }
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 255) {
    return "Customer email must not exceed 255 characters.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Customer email is not valid.";
  }
  return null;
}

export function validateCustomerName(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) {
    return "Customer name is required.";
  }
  if (name.trim().length > 255) {
    return "Customer name must not exceed 255 characters.";
  }
  return null;
}

export function validateOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    return `${fieldName} must be a string.`;
  }
  if (value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters.`;
  }
  return null;
}

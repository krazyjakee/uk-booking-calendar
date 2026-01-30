// Types
export type {
  BookingStatus,
  RecurrenceFrequency,
  HolidayRegion,
  TradesmanProfile,
  WorkingHours,
  Customer,
  Booking,
  BookingStatusLog,
  RecurrenceRule,
  UkPublicHoliday,
  AvailabilitySlot,
  AvailabilityDay,
} from "./types";

export { BOOKING_STATUSES, RECURRENCE_FREQUENCIES } from "./types";

// Timezone
export {
  isBST,
  getCurrentUKDate,
  getCurrentUKTime,
  formatUKDate,
  formatUKTime,
  ukLocalToUTC,
  utcToUKLocal,
  getISODayOfWeek,
  compareTime,
  addMinutesToTime,
  timeToMinutes,
} from "./timezone";

// Validation
export {
  validateDate,
  validateFutureDate,
  validateTime,
  validateHourBoundary,
  validateDuration,
  validateBookingStatus,
  validateRecurrenceFrequency,
  validateUUID,
  validateCustomerEmail,
  validateCustomerName,
  validateOptionalString,
} from "./validation";

// Status machine
export {
  canTransition,
  validateTransition,
  isTerminalStatus,
} from "./status-machine";

// Holidays
export { isPublicHoliday, getPublicHolidays } from "./holidays";

// Availability
export {
  getAvailableSlots,
  isSlotAvailable,
  isWithinWorkingHours,
} from "./availability";

// Recurrence
export { generateRecurrenceDates } from "./recurrence";

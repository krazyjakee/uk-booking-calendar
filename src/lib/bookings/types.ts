export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "in-progress",
  "completed",
  "cancelled",
  "no-show",
];

export type RecurrenceFrequency =
  | "daily"
  | "weekly"
  | "fortnightly"
  | "monthly";

export const RECURRENCE_FREQUENCIES: RecurrenceFrequency[] = [
  "daily",
  "weekly",
  "fortnightly",
  "monthly",
];

export type HolidayRegion =
  | "england-and-wales"
  | "scotland"
  | "northern-ireland"
  | "all";

export interface TradesmanProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  phone: string | null;
  buffer_minutes: number;
  cancellation_notice_hours: number;
  service_area_centre: string | null;
  service_area_radius_miles: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  id: string;
  tradesman_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  postcode: string | null;
  is_anonymised: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  tradesman_id: string;
  customer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: BookingStatus;
  description: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  postcode: string | null;
  recurrence_group_id: string | null;
  is_recurring: boolean;
  multi_day_group_id: string | null;
  multi_day_sequence: number | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingStatusLog {
  id: string;
  booking_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
}

export interface RecurrenceRule {
  id: string;
  tradesman_id: string;
  customer_id: string;
  frequency: RecurrenceFrequency;
  interval: number;
  start_date: string;
  end_date: string | null;
  max_occurrences: number | null;
  start_time: string;
  end_time: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UkPublicHoliday {
  id: string;
  date: string;
  name: string;
  region: HolidayRegion;
  created_at: string;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface AvailabilityDay {
  date: string;
  is_holiday: boolean;
  holiday_name: string | null;
  has_availability: boolean;
  slots: AvailabilitySlot[];
}

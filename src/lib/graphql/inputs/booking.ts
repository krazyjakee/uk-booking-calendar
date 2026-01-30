import builder from "../builder";
import { BookingStatusEnum, RecurrenceFrequencyEnum } from "../types/enums";

export const CreateBookingInput = builder.inputType("CreateBookingInput", {
  fields: (t) => ({
    tradesman_id: t.string({ required: true }),
    customer_email: t.string({ required: true }),
    customer_name: t.string({ required: true }),
    customer_phone: t.string(),
    customer_postcode: t.string(),
    date: t.string({ required: true }),
    start_time: t.string({ required: true }),
    duration_minutes: t.int({ required: true }),
    description: t.string(),
    customer_notes: t.string(),
    postcode: t.string(),
  }),
});

export const UpdateBookingInput = builder.inputType("UpdateBookingInput", {
  fields: (t) => ({
    date: t.string(),
    start_time: t.string(),
    duration_minutes: t.int(),
    description: t.string(),
    customer_notes: t.string(),
    internal_notes: t.string(),
    postcode: t.string(),
  }),
});

export const BookingFilterInput = builder.inputType("BookingFilterInput", {
  fields: (t) => ({
    tradesman_id: t.string(),
    date: t.string(),
    start_date: t.string(),
    end_date: t.string(),
    status: t.field({ type: BookingStatusEnum }),
    customer_id: t.string(),
  }),
});

export const RecurrenceInput = builder.inputType("RecurrenceInput", {
  fields: (t) => ({
    frequency: t.field({ type: RecurrenceFrequencyEnum, required: true }),
    interval: t.int({ defaultValue: 1 }),
    end_date: t.string(),
    max_occurrences: t.int(),
  }),
});

export const CreateRecurringBookingInput = builder.inputType(
  "CreateRecurringBookingInput",
  {
    fields: (t) => ({
      tradesman_id: t.string({ required: true }),
      customer_email: t.string({ required: true }),
      customer_name: t.string({ required: true }),
      customer_phone: t.string(),
      customer_postcode: t.string(),
      date: t.string({ required: true }),
      start_time: t.string({ required: true }),
      duration_minutes: t.int({ required: true }),
      description: t.string(),
      customer_notes: t.string(),
      postcode: t.string(),
      recurrence: t.field({ type: RecurrenceInput, required: true }),
    }),
  }
);

export const MultiDayEntry = builder.inputType("MultiDayEntry", {
  fields: (t) => ({
    date: t.string({ required: true }),
    start_time: t.string({ required: true }),
    duration_minutes: t.int({ required: true }),
  }),
});

export const CreateMultiDayBookingInput = builder.inputType(
  "CreateMultiDayBookingInput",
  {
    fields: (t) => ({
      tradesman_id: t.string({ required: true }),
      customer_email: t.string({ required: true }),
      customer_name: t.string({ required: true }),
      customer_phone: t.string(),
      customer_postcode: t.string(),
      days: t.field({ type: [MultiDayEntry], required: true }),
      description: t.string(),
      customer_notes: t.string(),
      postcode: t.string(),
    }),
  }
);

export const UpdateTradesmanProfileInput = builder.inputType(
  "UpdateTradesmanProfileInput",
  {
    fields: (t) => ({
      business_name: t.string(),
      phone: t.string(),
      buffer_minutes: t.int(),
      cancellation_notice_hours: t.int(),
      service_area_centre: t.string(),
      service_area_radius_miles: t.float(),
    }),
  }
);

export const WorkingHoursEntry = builder.inputType("WorkingHoursEntry", {
  fields: (t) => ({
    day_of_week: t.int({ required: true }),
    start_time: t.string({ required: true }),
    end_time: t.string({ required: true }),
    is_active: t.boolean({ required: true }),
  }),
});

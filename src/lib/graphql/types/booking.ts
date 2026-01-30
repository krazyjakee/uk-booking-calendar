import builder from "../builder";
import db from "@/lib/db";
import { BookingStatusEnum, bookingStatusReverseMap } from "./enums";
import { CustomerType } from "./customer";
import type { Booking, BookingStatusLog, Customer } from "@/lib/bookings/types";

export const BookingStatusLogEntryType =
  builder.objectRef<BookingStatusLog>("BookingStatusLogEntry");

builder.objectType(BookingStatusLogEntryType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    booking_id: t.exposeString("booking_id"),
    from_status: t.string({
      resolve: (parent) => parent.from_status,
      nullable: true,
    }),
    to_status: t.exposeString("to_status"),
    changed_by: t.string({
      resolve: (parent) => parent.changed_by,
      nullable: true,
    }),
    reason: t.string({ resolve: (parent) => parent.reason, nullable: true }),
    created_at: t.exposeString("created_at"),
  }),
});

export const BookingType = builder.objectRef<Booking>("Booking");

builder.objectType(BookingType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    tradesman_id: t.exposeString("tradesman_id"),
    customer_id: t.exposeString("customer_id"),
    date: t.exposeString("date"),
    start_time: t.exposeString("start_time"),
    end_time: t.exposeString("end_time"),
    duration_minutes: t.exposeInt("duration_minutes"),
    status: t.field({
      type: BookingStatusEnum,
      resolve: (parent) =>
        bookingStatusReverseMap[parent.status] as never,
    }),
    description: t.string({
      resolve: (parent) => parent.description,
      nullable: true,
    }),
    customer_notes: t.string({
      resolve: (parent) => parent.customer_notes,
      nullable: true,
    }),
    internal_notes: t.string({
      resolve: (parent) => parent.internal_notes,
      nullable: true,
    }),
    postcode: t.string({
      resolve: (parent) => parent.postcode,
      nullable: true,
    }),
    recurrence_group_id: t.string({
      resolve: (parent) => parent.recurrence_group_id,
      nullable: true,
    }),
    is_recurring: t.exposeBoolean("is_recurring"),
    multi_day_group_id: t.string({
      resolve: (parent) => parent.multi_day_group_id,
      nullable: true,
    }),
    multi_day_sequence: t.int({
      resolve: (parent) => parent.multi_day_sequence,
      nullable: true,
    }),
    cancelled_by: t.string({
      resolve: (parent) => parent.cancelled_by,
      nullable: true,
    }),
    cancellation_reason: t.string({
      resolve: (parent) => parent.cancellation_reason,
      nullable: true,
    }),
    cancelled_at: t.string({
      resolve: (parent) => parent.cancelled_at,
      nullable: true,
    }),
    created_by: t.string({
      resolve: (parent) => parent.created_by,
      nullable: true,
    }),
    created_at: t.exposeString("created_at"),
    updated_at: t.exposeString("updated_at"),

    // Relations
    customer: t.field({
      type: CustomerType,
      resolve: async (parent) => {
        return db("customers")
          .where("id", parent.customer_id)
          .first<Customer>();
      },
    }),
    status_log: t.field({
      type: [BookingStatusLogEntryType],
      resolve: async (parent) => {
        return db("booking_status_log")
          .where("booking_id", parent.id)
          .orderBy("created_at", "asc");
      },
    }),
  }),
});

// Paginated bookings wrapper
export const PaginatedBookingsType = builder.simpleObject(
  "PaginatedBookings",
  {
    fields: (t) => ({
      total: t.int(),
      page: t.int(),
      limit: t.int(),
    }),
  }
);

import builder from "../builder";
import db from "@/lib/db";
import { BookingType } from "../types/booking";
import { BookingStatusEnum, bookingStatusMap } from "../types/enums";
import { CreateBookingInput, UpdateBookingInput } from "../inputs/booking";
import {
  validateDate,
  validateFutureDate,
  validateTime,
  validateHourBoundary,
  validateDuration,
  validateCustomerEmail,
  validateCustomerName,
} from "@/lib/bookings/validation";
import { isSlotAvailable, isWithinWorkingHours } from "@/lib/bookings/availability";
import { isPublicHoliday } from "@/lib/bookings/holidays";
import { validateTransition, isTerminalStatus } from "@/lib/bookings/status-machine";
import { getCurrentUKDate, addMinutesToTime } from "@/lib/bookings/timezone";
import { GraphQLError } from "graphql";
import type { Booking, Customer } from "@/lib/bookings/types";

// Helper: find or create customer by email
async function upsertCustomer(input: {
  email: string;
  name: string;
  phone?: string | null;
  postcode?: string | null;
}): Promise<string> {
  const normalisedEmail = input.email.trim().toLowerCase();

  const existing = await db("customers")
    .where("email", normalisedEmail)
    .where("is_anonymised", false)
    .first<Customer | undefined>();

  if (existing) {
    // Update name/phone/postcode if provided
    await db("customers")
      .where("id", existing.id)
      .update({
        name: input.name,
        phone: input.phone ?? existing.phone,
        postcode: input.postcode ?? existing.postcode,
        updated_at: db.fn.now(),
      });
    return existing.id;
  }

  const [inserted] = await db("customers")
    .insert({
      email: normalisedEmail,
      name: input.name,
      phone: input.phone ?? null,
      postcode: input.postcode ?? null,
    })
    .returning("id");

  return inserted.id;
}

// Helper: check tradesman ownership
function checkTradesmanAccess(
  userRole: string,
  userId: string,
  tradesmanId: string
): void {
  if (userRole === "tradesman" && tradesmanId !== userId) {
    throw new GraphQLError("Tradesmen can only manage their own bookings.");
  }
}

// Create a single booking
builder.mutationField("createBooking", (t) =>
  t.field({
    type: BookingType,
    args: {
      input: t.arg({ type: CreateBookingInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");
      checkTradesmanAccess(ctx.user.role, ctx.user.sub, input.tradesman_id);

      // Validate inputs
      const errors: string[] = [];
      const emailErr = validateCustomerEmail(input.customer_email);
      if (emailErr) errors.push(emailErr);
      const nameErr = validateCustomerName(input.customer_name);
      if (nameErr) errors.push(nameErr);
      const dateErr = validateDate(input.date);
      if (dateErr) errors.push(dateErr);
      const timeErr = validateTime(input.start_time);
      if (timeErr) errors.push(timeErr);
      const hourErr = validateHourBoundary(input.start_time);
      if (hourErr) errors.push(hourErr);
      const durErr = validateDuration(input.duration_minutes);
      if (durErr) errors.push(durErr);

      if (errors.length > 0) {
        throw new GraphQLError(errors.join(" "));
      }

      // Check date is not in the past
      const futureErr = validateFutureDate(input.date, getCurrentUKDate());
      if (futureErr) throw new GraphQLError(futureErr);

      // Check tradesman exists and is active
      const tradesman = await db("users")
        .where("id", input.tradesman_id)
        .where("role", "tradesman")
        .where("is_active", true)
        .first();

      if (!tradesman) {
        throw new GraphQLError("Tradesman not found or is inactive.");
      }

      const endTime = addMinutesToTime(input.start_time, input.duration_minutes);

      // Check public holiday
      const holiday = await isPublicHoliday(input.date);
      if (holiday.isHoliday) {
        throw new GraphQLError(
          `Cannot book on ${holiday.name} (public holiday).`
        );
      }

      // Check within working hours
      const withinHours = await isWithinWorkingHours(
        input.tradesman_id,
        input.date,
        input.start_time,
        endTime
      );
      if (!withinHours) {
        throw new GraphQLError(
          "Requested time is outside the tradesman's working hours."
        );
      }

      // Check availability (no double-booking)
      const available = await isSlotAvailable(
        input.tradesman_id,
        input.date,
        input.start_time,
        endTime
      );
      if (!available) {
        throw new GraphQLError("Requested time slot is not available.");
      }

      // Upsert customer
      const customerId = await upsertCustomer({
        email: input.customer_email,
        name: input.customer_name,
        phone: input.customer_phone,
        postcode: input.customer_postcode,
      });

      // Create booking in a transaction
      const booking = await db.transaction(async (trx) => {
        const [newBooking] = await trx("bookings")
          .insert({
            tradesman_id: input.tradesman_id,
            customer_id: customerId,
            date: input.date,
            start_time: input.start_time,
            end_time: endTime,
            duration_minutes: input.duration_minutes,
            status: "pending",
            description: input.description ?? null,
            customer_notes: input.customer_notes ?? null,
            postcode: input.postcode ?? null,
            created_by: ctx.user!.sub,
          })
          .returning("*");

        // Log initial status
        await trx("booking_status_log").insert({
          booking_id: newBooking.id,
          from_status: null,
          to_status: "pending",
          changed_by: ctx.user!.sub,
        });

        return newBooking as Booking;
      });

      return booking;
    },
  })
);

// Update a booking
builder.mutationField("updateBooking", (t) =>
  t.field({
    type: BookingType,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateBookingInput, required: true }),
    },
    resolve: async (_, { id, input }, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      const booking = await db("bookings")
        .where("id", id)
        .first<Booking | undefined>();

      if (!booking) throw new GraphQLError("Booking not found.");

      checkTradesmanAccess(ctx.user.role, ctx.user.sub, booking.tradesman_id);

      if (isTerminalStatus(booking.status)) {
        throw new GraphQLError(
          `Cannot update a booking with status "${booking.status}".`
        );
      }

      const updates: Record<string, unknown> = { updated_at: db.fn.now() };

      // Build update object from provided fields
      if (input.description !== undefined) updates.description = input.description;
      if (input.customer_notes !== undefined) updates.customer_notes = input.customer_notes;
      if (input.internal_notes !== undefined) updates.internal_notes = input.internal_notes;
      if (input.postcode !== undefined) updates.postcode = input.postcode;

      // If date/time changed, revalidate availability
      const newDate = input.date ?? booking.date;
      const newStartTime = input.start_time ?? booking.start_time;
      const newDuration = input.duration_minutes ?? booking.duration_minutes;
      const dateTimeChanged =
        input.date !== undefined ||
        input.start_time !== undefined ||
        input.duration_minutes !== undefined;

      if (dateTimeChanged) {
        if (input.date) {
          const dateErr = validateDate(input.date);
          if (dateErr) throw new GraphQLError(dateErr);
          const futureErr = validateFutureDate(input.date, getCurrentUKDate());
          if (futureErr) throw new GraphQLError(futureErr);
        }
        if (input.start_time) {
          const timeErr = validateTime(input.start_time);
          if (timeErr) throw new GraphQLError(timeErr);
          const hourErr = validateHourBoundary(input.start_time);
          if (hourErr) throw new GraphQLError(hourErr);
        }
        if (input.duration_minutes) {
          const durErr = validateDuration(input.duration_minutes);
          if (durErr) throw new GraphQLError(durErr);
        }

        const newEndTime = addMinutesToTime(newStartTime, newDuration);

        // Check working hours
        const withinHours = await isWithinWorkingHours(
          booking.tradesman_id,
          newDate,
          newStartTime,
          newEndTime
        );
        if (!withinHours) {
          throw new GraphQLError(
            "Requested time is outside the tradesman's working hours."
          );
        }

        // Check availability (excluding this booking)
        const available = await isSlotAvailable(
          booking.tradesman_id,
          newDate,
          newStartTime,
          newEndTime,
          booking.id
        );
        if (!available) {
          throw new GraphQLError("Requested time slot is not available.");
        }

        updates.date = newDate;
        updates.start_time = newStartTime;
        updates.end_time = newEndTime;
        updates.duration_minutes = newDuration;
      }

      await db("bookings").where("id", id).update(updates);

      return db("bookings").where("id", id).first<Booking>();
    },
  })
);

// Cancel a booking
builder.mutationField("cancelBooking", (t) =>
  t.field({
    type: BookingType,
    args: {
      id: t.arg.string({ required: true }),
      reason: t.arg.string(),
    },
    resolve: async (_, { id, reason }, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      const booking = await db("bookings")
        .where("id", id)
        .first<Booking | undefined>();

      if (!booking) throw new GraphQLError("Booking not found.");

      checkTradesmanAccess(ctx.user.role, ctx.user.sub, booking.tradesman_id);

      const transitionErr = validateTransition(booking.status, "cancelled");
      if (transitionErr) throw new GraphQLError(transitionErr);

      await db.transaction(async (trx) => {
        await trx("bookings").where("id", id).update({
          status: "cancelled",
          cancelled_by: ctx.user!.role,
          cancellation_reason: reason ?? null,
          cancelled_at: new Date().toISOString(),
          updated_at: trx.fn.now(),
        });

        await trx("booking_status_log").insert({
          booking_id: id,
          from_status: booking.status,
          to_status: "cancelled",
          changed_by: ctx.user!.sub,
          reason: reason ?? null,
        });
      });

      return db("bookings").where("id", id).first<Booking>();
    },
  })
);

// Update booking status
builder.mutationField("updateBookingStatus", (t) =>
  t.field({
    type: BookingType,
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg({ type: BookingStatusEnum, required: true }),
      reason: t.arg.string(),
    },
    resolve: async (_, { id, status: gqlStatus, reason }, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      const newStatus = bookingStatusMap[gqlStatus];
      if (!newStatus) throw new GraphQLError("Invalid status.");

      const booking = await db("bookings")
        .where("id", id)
        .first<Booking | undefined>();

      if (!booking) throw new GraphQLError("Booking not found.");

      checkTradesmanAccess(ctx.user.role, ctx.user.sub, booking.tradesman_id);

      const transitionErr = validateTransition(booking.status, newStatus);
      if (transitionErr) throw new GraphQLError(transitionErr);

      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: db.fn.now(),
      };

      if (newStatus === "cancelled") {
        updates.cancelled_by = ctx.user.role;
        updates.cancellation_reason = reason ?? null;
        updates.cancelled_at = new Date().toISOString();
      }

      await db.transaction(async (trx) => {
        await trx("bookings").where("id", id).update(updates);

        await trx("booking_status_log").insert({
          booking_id: id,
          from_status: booking.status,
          to_status: newStatus,
          changed_by: ctx.user!.sub,
          reason: reason ?? null,
        });
      });

      return db("bookings").where("id", id).first<Booking>();
    },
  })
);

import builder from "../builder";
import db from "@/lib/db";
import { BookingType } from "../types/booking";
import { CreateRecurringBookingInput } from "../inputs/booking";
import { recurrenceFrequencyMap } from "../types/enums";
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
import { generateRecurrenceDates } from "@/lib/bookings/recurrence";
import { getCurrentUKDate, addMinutesToTime } from "@/lib/bookings/timezone";
import { GraphQLError } from "graphql";
import type { Booking, Customer } from "@/lib/bookings/types";
import { randomUUID } from "crypto";

builder.mutationField("createRecurringBooking", (t) =>
  t.field({
    type: [BookingType],
    args: {
      input: t.arg({ type: CreateRecurringBookingInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      if (
        ctx.user.role === "tradesman" &&
        input.tradesman_id !== ctx.user.sub
      ) {
        throw new GraphQLError("Tradesmen can only manage their own bookings.");
      }

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

      const futureErr = validateFutureDate(input.date, getCurrentUKDate());
      if (futureErr) throw new GraphQLError(futureErr);

      // Check tradesman exists
      const tradesman = await db("users")
        .where("id", input.tradesman_id)
        .where("role", "tradesman")
        .where("is_active", true)
        .first();

      if (!tradesman) {
        throw new GraphQLError("Tradesman not found or is inactive.");
      }

      const frequency = recurrenceFrequencyMap[input.recurrence.frequency];
      if (!frequency) throw new GraphQLError("Invalid recurrence frequency.");

      const endTime = addMinutesToTime(input.start_time, input.duration_minutes);

      // Generate recurrence dates
      const dates = generateRecurrenceDates({
        frequency,
        interval: input.recurrence.interval ?? 1,
        startDate: input.date,
        endDate: input.recurrence.end_date,
        maxOccurrences: input.recurrence.max_occurrences,
      });

      if (dates.length === 0) {
        throw new GraphQLError("No dates generated for the recurrence rule.");
      }

      // Validate availability for each date
      const unavailableDates: string[] = [];
      for (const date of dates) {
        const withinHours = await isWithinWorkingHours(
          input.tradesman_id,
          date,
          input.start_time,
          endTime
        );
        const available = await isSlotAvailable(
          input.tradesman_id,
          date,
          input.start_time,
          endTime
        );
        if (!withinHours || !available) {
          unavailableDates.push(date);
        }
      }

      if (unavailableDates.length > 0) {
        throw new GraphQLError(
          `The following dates are unavailable: ${unavailableDates.join(", ")}.`
        );
      }

      // Upsert customer
      const normalisedEmail = input.customer_email.trim().toLowerCase();
      let customerId: string;

      const existingCustomer = await db("customers")
        .where("email", normalisedEmail)
        .where("is_anonymised", false)
        .first<Customer | undefined>();

      if (existingCustomer) {
        await db("customers")
          .where("id", existingCustomer.id)
          .update({
            name: input.customer_name,
            phone: input.customer_phone ?? existingCustomer.phone,
            postcode: input.customer_postcode ?? existingCustomer.postcode,
            updated_at: db.fn.now(),
          });
        customerId = existingCustomer.id;
      } else {
        const [inserted] = await db("customers")
          .insert({
            email: normalisedEmail,
            name: input.customer_name,
            phone: input.customer_phone ?? null,
            postcode: input.customer_postcode ?? null,
          })
          .returning("id");
        customerId = inserted.id;
      }

      // Create recurrence rule and bookings in a transaction
      const recurrenceGroupId = randomUUID();

      const bookings = await db.transaction(async (trx) => {
        // Create recurrence rule
        await trx("recurrence_rules").insert({
          id: recurrenceGroupId,
          tradesman_id: input.tradesman_id,
          customer_id: customerId,
          frequency,
          interval: input.recurrence.interval ?? 1,
          start_date: input.date,
          end_date: input.recurrence.end_date ?? null,
          max_occurrences: input.recurrence.max_occurrences ?? null,
          start_time: input.start_time,
          end_time: endTime,
          description: input.description ?? null,
        });

        // Create materialised booking instances
        const createdBookings: Booking[] = [];
        for (const date of dates) {
          const [booking] = await trx("bookings")
            .insert({
              tradesman_id: input.tradesman_id,
              customer_id: customerId,
              date,
              start_time: input.start_time,
              end_time: endTime,
              duration_minutes: input.duration_minutes,
              status: "pending",
              description: input.description ?? null,
              customer_notes: input.customer_notes ?? null,
              postcode: input.postcode ?? null,
              recurrence_group_id: recurrenceGroupId,
              is_recurring: true,
              created_by: ctx.user!.sub,
            })
            .returning("*");

          await trx("booking_status_log").insert({
            booking_id: booking.id,
            from_status: null,
            to_status: "pending",
            changed_by: ctx.user!.sub,
          });

          createdBookings.push(booking as Booking);
        }

        return createdBookings;
      });

      return bookings;
    },
  })
);

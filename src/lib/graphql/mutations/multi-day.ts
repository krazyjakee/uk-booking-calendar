import builder from "../builder";
import db from "@/lib/db";
import { BookingType } from "../types/booking";
import { CreateMultiDayBookingInput } from "../inputs/booking";
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
import { getCurrentUKDate, addMinutesToTime } from "@/lib/bookings/timezone";
import { GraphQLError } from "graphql";
import type { Booking, Customer } from "@/lib/bookings/types";
import { randomUUID } from "crypto";

builder.mutationField("createMultiDayBooking", (t) =>
  t.field({
    type: [BookingType],
    args: {
      input: t.arg({ type: CreateMultiDayBookingInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      if (
        ctx.user.role === "tradesman" &&
        input.tradesman_id !== ctx.user.sub
      ) {
        throw new GraphQLError("Tradesmen can only manage their own bookings.");
      }

      // Validate common fields
      const emailErr = validateCustomerEmail(input.customer_email);
      if (emailErr) throw new GraphQLError(emailErr);
      const nameErr = validateCustomerName(input.customer_name);
      if (nameErr) throw new GraphQLError(nameErr);

      if (!input.days || input.days.length === 0) {
        throw new GraphQLError("At least one day is required.");
      }

      // Validate each day
      const currentDate = getCurrentUKDate();
      for (const day of input.days) {
        const dateErr = validateDate(day.date);
        if (dateErr) throw new GraphQLError(`Day ${day.date}: ${dateErr}`);
        const futureErr = validateFutureDate(day.date, currentDate);
        if (futureErr) throw new GraphQLError(`Day ${day.date}: ${futureErr}`);
        const timeErr = validateTime(day.start_time);
        if (timeErr) throw new GraphQLError(`Day ${day.date}: ${timeErr}`);
        const hourErr = validateHourBoundary(day.start_time);
        if (hourErr) throw new GraphQLError(`Day ${day.date}: ${hourErr}`);
        const durErr = validateDuration(day.duration_minutes);
        if (durErr) throw new GraphQLError(`Day ${day.date}: ${durErr}`);
      }

      // Check tradesman exists
      const tradesman = await db("users")
        .where("id", input.tradesman_id)
        .where("role", "tradesman")
        .where("is_active", true)
        .first();

      if (!tradesman) {
        throw new GraphQLError("Tradesman not found or is inactive.");
      }

      // Validate availability for each day
      for (const day of input.days) {
        const endTime = addMinutesToTime(day.start_time, day.duration_minutes);

        const withinHours = await isWithinWorkingHours(
          input.tradesman_id,
          day.date,
          day.start_time,
          endTime
        );
        if (!withinHours) {
          throw new GraphQLError(
            `Day ${day.date}: time is outside working hours.`
          );
        }

        const available = await isSlotAvailable(
          input.tradesman_id,
          day.date,
          day.start_time,
          endTime
        );
        if (!available) {
          throw new GraphQLError(
            `Day ${day.date}: time slot is not available.`
          );
        }
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

      // Create bookings in a transaction
      const multiDayGroupId = randomUUID();

      const bookings = await db.transaction(async (trx) => {
        const createdBookings: Booking[] = [];

        for (let i = 0; i < input.days.length; i++) {
          const day = input.days[i];
          const endTime = addMinutesToTime(day.start_time, day.duration_minutes);

          const [booking] = await trx("bookings")
            .insert({
              tradesman_id: input.tradesman_id,
              customer_id: customerId,
              date: day.date,
              start_time: day.start_time,
              end_time: endTime,
              duration_minutes: day.duration_minutes,
              status: "pending",
              description: input.description ?? null,
              customer_notes: input.customer_notes ?? null,
              postcode: input.postcode ?? null,
              multi_day_group_id: multiDayGroupId,
              multi_day_sequence: i + 1,
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

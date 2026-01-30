import builder from "../builder";
import db from "@/lib/db";
import { TradesmanProfileType, WorkingHoursType } from "../types/tradesman";
import { UpdateTradesmanProfileInput, WorkingHoursEntry } from "../inputs/booking";
import { GraphQLError } from "graphql";
import type { TradesmanProfile, WorkingHours } from "@/lib/bookings/types";

// Update tradesman profile
builder.mutationField("updateTradesmanProfile", (t) =>
  t.field({
    type: TradesmanProfileType,
    args: {
      user_id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateTradesmanProfileInput, required: true }),
    },
    resolve: async (_, { user_id, input }, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      // Admin/manager can update any profile; tradesman only their own
      if (
        ctx.user.role === "tradesman" &&
        user_id !== ctx.user.sub
      ) {
        throw new GraphQLError("Forbidden.");
      }

      // Check tradesman user exists
      const user = await db("users")
        .where("id", user_id)
        .where("role", "tradesman")
        .first();

      if (!user) {
        throw new GraphQLError("Tradesman not found.");
      }

      // Ensure profile exists (create if not)
      let profile = await db("tradesman_profiles")
        .where("user_id", user_id)
        .first<TradesmanProfile | undefined>();

      if (!profile) {
        const [created] = await db("tradesman_profiles")
          .insert({ user_id })
          .returning("*");
        profile = created as TradesmanProfile;
      }

      // Build updates
      const updates: Record<string, unknown> = { updated_at: db.fn.now() };
      if (input.business_name !== undefined) updates.business_name = input.business_name;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.buffer_minutes != null) {
        if (input.buffer_minutes < 0) {
          throw new GraphQLError("Buffer minutes must not be negative.");
        }
        updates.buffer_minutes = input.buffer_minutes;
      }
      if (input.cancellation_notice_hours != null) {
        if (input.cancellation_notice_hours < 0) {
          throw new GraphQLError("Cancellation notice hours must not be negative.");
        }
        updates.cancellation_notice_hours = input.cancellation_notice_hours;
      }
      if (input.service_area_centre !== undefined) {
        updates.service_area_centre = input.service_area_centre;
      }
      if (input.service_area_radius_miles !== undefined) {
        if (
          input.service_area_radius_miles !== null &&
          input.service_area_radius_miles < 0
        ) {
          throw new GraphQLError("Service area radius must not be negative.");
        }
        updates.service_area_radius_miles = input.service_area_radius_miles;
      }

      await db("tradesman_profiles").where("user_id", user_id).update(updates);

      return db("tradesman_profiles")
        .where("user_id", user_id)
        .first<TradesmanProfile>();
    },
  })
);

// Set working hours (replace all for a tradesman)
builder.mutationField("setWorkingHours", (t) =>
  t.field({
    type: [WorkingHoursType],
    args: {
      tradesman_id: t.arg.string({ required: true }),
      hours: t.arg({ type: [WorkingHoursEntry], required: true }),
    },
    resolve: async (_, { tradesman_id, hours }, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      // Only admin and manager can set working hours
      if (!["admin", "manager"].includes(ctx.user.role)) {
        throw new GraphQLError("Only administrators and managers can set working hours.");
      }

      // Check tradesman exists
      const user = await db("users")
        .where("id", tradesman_id)
        .where("role", "tradesman")
        .first();

      if (!user) {
        throw new GraphQLError("Tradesman not found.");
      }

      // Validate entries
      for (const entry of hours) {
        if (entry.day_of_week < 0 || entry.day_of_week > 6) {
          throw new GraphQLError(
            "Day of week must be between 0 (Monday) and 6 (Sunday)."
          );
        }
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(entry.start_time) || !timeRegex.test(entry.end_time)) {
          throw new GraphQLError("Times must be in HH:MM format.");
        }
        if (entry.start_time >= entry.end_time) {
          throw new GraphQLError(
            `Day ${entry.day_of_week}: start time must be before end time.`
          );
        }
      }

      // Replace all working hours in a transaction
      await db.transaction(async (trx) => {
        await trx("working_hours").where("tradesman_id", tradesman_id).del();

        for (const entry of hours) {
          await trx("working_hours").insert({
            tradesman_id,
            day_of_week: entry.day_of_week,
            start_time: entry.start_time,
            end_time: entry.end_time,
            is_active: entry.is_active,
          });
        }
      });

      return db("working_hours")
        .where("tradesman_id", tradesman_id)
        .orderBy("day_of_week", "asc")
        .orderBy("start_time", "asc") as Promise<WorkingHours[]>;
    },
  })
);

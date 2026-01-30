import builder from "../builder";
import db from "@/lib/db";
import { UkPublicHolidayType } from "../types/holiday";
import { HolidayRegionEnum, holidayRegionMap } from "../types/enums";
import { validateDate } from "@/lib/bookings/validation";
import { GraphQLError } from "graphql";
import type { UkPublicHoliday } from "@/lib/bookings/types";

builder.mutationField("addPublicHoliday", (t) =>
  t.field({
    type: UkPublicHolidayType,
    args: {
      date: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      region: t.arg({ type: HolidayRegionEnum }),
    },
    resolve: async (_, { date, name, region }, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      if (ctx.user.role !== "admin") {
        throw new GraphQLError("Only administrators can add public holidays.");
      }

      const dateErr = validateDate(date);
      if (dateErr) throw new GraphQLError(dateErr);

      if (!name.trim()) {
        throw new GraphQLError("Holiday name is required.");
      }

      const dbRegion = region
        ? holidayRegionMap[region] ?? "england-and-wales"
        : "england-and-wales";

      // Check for duplicate
      const existing = await db("uk_public_holidays")
        .where("date", date)
        .first();

      if (existing) {
        throw new GraphQLError(`A holiday already exists on ${date}.`);
      }

      const [holiday] = await db("uk_public_holidays")
        .insert({
          date,
          name: name.trim(),
          region: dbRegion,
        })
        .returning("*");

      return holiday as UkPublicHoliday;
    },
  })
);

import builder from "../builder";
import db from "@/lib/db";
import { UkPublicHolidayType } from "../types/holiday";
import { HolidayRegionEnum, holidayRegionMap } from "../types/enums";
import { GraphQLError } from "graphql";
import type { UkPublicHoliday } from "@/lib/bookings/types";

builder.queryField("publicHolidays", (t) =>
  t.field({
    type: [UkPublicHolidayType],
    args: {
      year: t.arg.int(),
      region: t.arg({ type: HolidayRegionEnum }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      const year = args.year ?? new Date().getFullYear();
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const query = db("uk_public_holidays")
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date", "asc");

      if (args.region) {
        const dbRegion = holidayRegionMap[args.region];
        if (dbRegion && dbRegion !== "all") {
          query.where(function () {
            this.where("region", dbRegion).orWhere("region", "all");
          });
        }
      }

      return query as Promise<UkPublicHoliday[]>;
    },
  })
);

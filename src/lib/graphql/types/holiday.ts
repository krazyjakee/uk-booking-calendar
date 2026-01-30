import builder from "../builder";
import { HolidayRegionEnum, holidayRegionMap } from "./enums";
import type { UkPublicHoliday } from "@/lib/bookings/types";

// Reverse map for DB → GraphQL
const holidayRegionReverseMap = Object.fromEntries(
  Object.entries(holidayRegionMap).map(([k, v]) => [v, k])
);

export const UkPublicHolidayType =
  builder.objectRef<UkPublicHoliday>("UkPublicHoliday");

builder.objectType(UkPublicHolidayType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    date: t.exposeString("date"),
    name: t.exposeString("name"),
    region: t.field({
      type: HolidayRegionEnum,
      resolve: (parent) =>
        (holidayRegionReverseMap[parent.region] ?? "ENGLAND_AND_WALES") as never,
    }),
    created_at: t.exposeString("created_at"),
  }),
});

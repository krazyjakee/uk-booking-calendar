import builder from "../builder";
import type { AvailabilitySlot, AvailabilityDay } from "@/lib/bookings/types";

export const AvailabilitySlotType =
  builder.objectRef<AvailabilitySlot>("AvailabilitySlot");

builder.objectType(AvailabilitySlotType, {
  fields: (t) => ({
    start_time: t.exposeString("start_time"),
    end_time: t.exposeString("end_time"),
    available: t.exposeBoolean("available"),
  }),
});

export const AvailabilityDayType =
  builder.objectRef<AvailabilityDay>("AvailabilityDay");

builder.objectType(AvailabilityDayType, {
  fields: (t) => ({
    date: t.exposeString("date"),
    is_holiday: t.exposeBoolean("is_holiday"),
    holiday_name: t.string({
      resolve: (parent) => parent.holiday_name,
      nullable: true,
    }),
    has_availability: t.exposeBoolean("has_availability"),
    slots: t.field({
      type: [AvailabilitySlotType],
      resolve: (parent) => parent.slots,
    }),
  }),
});

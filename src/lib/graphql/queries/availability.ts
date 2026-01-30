import builder from "../builder";
import { AvailabilitySlotType, AvailabilityDayType } from "../types/availability";
import { getAvailableSlots } from "@/lib/bookings/availability";
import { validateDate, validateUUID } from "@/lib/bookings/validation";
import { GraphQLError } from "graphql";
import type { AvailabilityDay } from "@/lib/bookings/types";

// Single-day availability — PUBLIC (no auth required)
builder.queryField("availableSlots", (t) =>
  t.field({
    type: [AvailabilitySlotType],
    args: {
      tradesman_id: t.arg.string({ required: true }),
      date: t.arg.string({ required: true }),
      duration_minutes: t.arg.int({ defaultValue: 60 }),
    },
    resolve: async (_, args) => {
      const idError = validateUUID(args.tradesman_id, "Tradesman ID");
      if (idError) throw new GraphQLError(idError);

      const dateError = validateDate(args.date);
      if (dateError) throw new GraphQLError(dateError);

      const { slots } = await getAvailableSlots(
        args.tradesman_id,
        args.date,
        args.duration_minutes ?? 60
      );

      return slots;
    },
  })
);

// Date range availability — PUBLIC (no auth required)
builder.queryField("availabilityRange", (t) =>
  t.field({
    type: [AvailabilityDayType],
    args: {
      tradesman_id: t.arg.string({ required: true }),
      start_date: t.arg.string({ required: true }),
      end_date: t.arg.string({ required: true }),
      duration_minutes: t.arg.int({ defaultValue: 60 }),
    },
    resolve: async (_, args) => {
      const idError = validateUUID(args.tradesman_id, "Tradesman ID");
      if (idError) throw new GraphQLError(idError);

      const startError = validateDate(args.start_date);
      if (startError) throw new GraphQLError(startError);

      const endError = validateDate(args.end_date);
      if (endError) throw new GraphQLError(endError);

      if (args.start_date > args.end_date) {
        throw new GraphQLError("Start date must be before end date.");
      }

      // Limit to 30 days
      const start = new Date(args.start_date + "T00:00:00Z");
      const end = new Date(args.end_date + "T00:00:00Z");
      const diffDays =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        throw new GraphQLError("Date range must not exceed 30 days.");
      }

      const days: AvailabilityDay[] = [];
      const current = new Date(start);

      while (current <= end) {
        const dateStr = current.toISOString().slice(0, 10);
        const result = await getAvailableSlots(
          args.tradesman_id,
          dateStr,
          args.duration_minutes ?? 60
        );

        days.push({
          date: dateStr,
          is_holiday: result.isHoliday,
          holiday_name: result.holidayName,
          has_availability: result.slots.some((s) => s.available),
          slots: result.slots,
        });

        current.setUTCDate(current.getUTCDate() + 1);
      }

      return days;
    },
  })
);

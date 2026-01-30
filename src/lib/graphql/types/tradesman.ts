import builder from "../builder";
import db from "@/lib/db";
import type { TradesmanProfile, WorkingHours } from "@/lib/bookings/types";

export const WorkingHoursType = builder.objectRef<WorkingHours>("WorkingHours");

builder.objectType(WorkingHoursType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    tradesman_id: t.exposeString("tradesman_id"),
    day_of_week: t.exposeInt("day_of_week"),
    start_time: t.exposeString("start_time"),
    end_time: t.exposeString("end_time"),
    is_active: t.exposeBoolean("is_active"),
  }),
});

export const TradesmanProfileType =
  builder.objectRef<TradesmanProfile>("TradesmanProfile");

builder.objectType(TradesmanProfileType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    user_id: t.exposeString("user_id"),
    business_name: t.string({
      resolve: (parent) => parent.business_name,
      nullable: true,
    }),
    phone: t.string({ resolve: (parent) => parent.phone, nullable: true }),
    buffer_minutes: t.exposeInt("buffer_minutes"),
    cancellation_notice_hours: t.exposeInt("cancellation_notice_hours"),
    service_area_centre: t.string({
      resolve: (parent) => parent.service_area_centre,
      nullable: true,
    }),
    service_area_radius_miles: t.float({
      resolve: (parent) => parent.service_area_radius_miles,
      nullable: true,
    }),
    created_at: t.exposeString("created_at"),
    updated_at: t.exposeString("updated_at"),
    working_hours: t.field({
      type: [WorkingHoursType],
      resolve: async (parent) => {
        return db("working_hours")
          .where("tradesman_id", parent.user_id)
          .where("is_active", true)
          .orderBy("day_of_week", "asc")
          .orderBy("start_time", "asc");
      },
    }),
  }),
});

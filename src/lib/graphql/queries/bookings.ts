import builder from "../builder";
import db from "@/lib/db";
import { BookingType } from "../types/booking";
import { BookingFilterInput } from "../inputs/booking";
import { bookingStatusMap } from "../types/enums";
import { GraphQLError } from "graphql";
import type { Booking } from "@/lib/bookings/types";

// Single booking by ID
builder.queryField("booking", (t) =>
  t.field({
    type: BookingType,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      const booking = await db("bookings")
        .where("id", args.id)
        .first<Booking | undefined>();

      if (!booking) return null;

      // Tradesmen can only view their own bookings
      if (
        ctx.user.role === "tradesman" &&
        booking.tradesman_id !== ctx.user.sub
      ) {
        throw new GraphQLError("Forbidden.");
      }

      return booking;
    },
  })
);

// Paginated booking list
builder.queryField("bookings", (t) =>
  t.field({
    type: [BookingType],
    args: {
      filter: t.arg({ type: BookingFilterInput }),
      page: t.arg.int({ defaultValue: 1 }),
      limit: t.arg.int({ defaultValue: 50 }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      const page = Math.max(1, args.page ?? 1);
      const limit = Math.min(200, Math.max(1, args.limit ?? 50));
      const offset = (page - 1) * limit;

      const query = db("bookings").orderBy("date", "desc").orderBy("start_time", "asc");

      // Tradesmen can only see their own bookings
      if (ctx.user.role === "tradesman") {
        query.where("tradesman_id", ctx.user.sub);
      }

      // Apply filters
      const filter = args.filter;
      if (filter) {
        if (filter.tradesman_id) {
          query.where("tradesman_id", filter.tradesman_id);
        }
        if (filter.date) {
          query.where("date", filter.date);
        }
        if (filter.start_date) {
          query.where("date", ">=", filter.start_date);
        }
        if (filter.end_date) {
          query.where("date", "<=", filter.end_date);
        }
        if (filter.status) {
          const dbStatus = bookingStatusMap[filter.status];
          if (dbStatus) {
            query.where("status", dbStatus);
          }
        }
        if (filter.customer_id) {
          query.where("customer_id", filter.customer_id);
        }
      }

      return query.limit(limit).offset(offset);
    },
  })
);

// Bookings count (for pagination metadata)
builder.queryField("bookingsCount", (t) =>
  t.field({
    type: "Int",
    args: {
      filter: t.arg({ type: BookingFilterInput }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      const query = db("bookings").count("* as count");

      if (ctx.user.role === "tradesman") {
        query.where("tradesman_id", ctx.user.sub);
      }

      const filter = args.filter;
      if (filter) {
        if (filter.tradesman_id) {
          query.where("tradesman_id", filter.tradesman_id);
        }
        if (filter.date) {
          query.where("date", filter.date);
        }
        if (filter.start_date) {
          query.where("date", ">=", filter.start_date);
        }
        if (filter.end_date) {
          query.where("date", "<=", filter.end_date);
        }
        if (filter.status) {
          const dbStatus = bookingStatusMap[filter.status];
          if (dbStatus) {
            query.where("status", dbStatus);
          }
        }
        if (filter.customer_id) {
          query.where("customer_id", filter.customer_id);
        }
      }

      const result = await query.first<{ count: number }>();
      return result?.count ?? 0;
    },
  })
);

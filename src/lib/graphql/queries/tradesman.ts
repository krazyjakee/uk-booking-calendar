import builder from "../builder";
import db from "@/lib/db";
import { TradesmanProfileType } from "../types/tradesman";
import { GraphQLError } from "graphql";
import type { TradesmanProfile } from "@/lib/bookings/types";

builder.queryField("tradesmanProfile", (t) =>
  t.field({
    type: TradesmanProfileType,
    nullable: true,
    args: {
      user_id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      if (!ctx.user) throw new GraphQLError("Unauthorised.");

      // Tradesmen can only view their own profile
      if (ctx.user.role === "tradesman" && args.user_id !== ctx.user.sub) {
        throw new GraphQLError("Forbidden.");
      }

      return db("tradesman_profiles")
        .where("user_id", args.user_id)
        .first<TradesmanProfile | undefined>() ?? null;
    },
  })
);

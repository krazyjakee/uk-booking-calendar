import builder from "../builder";
import db from "@/lib/db";
import { SafeUserType } from "../types/user";
import { clearAuthCookie } from "@/lib/auth";
import type { User, SafeUser } from "@/lib/auth/types";

builder.queryField("me", (t) =>
  t.field({
    type: SafeUserType,
    nullable: true,
    resolve: async (_, _args, ctx) => {
      if (!ctx.user) return null;

      const user = await db("users")
        .where({ id: ctx.user.sub })
        .first<User | undefined>();

      if (!user || !user.is_active) {
        await clearAuthCookie();
        return null;
      }

      const safeUser: SafeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      return safeUser;
    },
  })
);

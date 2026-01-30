import builder from "../builder";
import type { UserRole } from "@/lib/auth/types";
import type { SafeUser } from "@/lib/auth/types";

// GraphQL enum ↔ DB value mapping
export const userRoleMap: Record<string, UserRole> = {
  ADMIN: "admin",
  TRADESMAN: "tradesman",
  MANAGER: "manager",
};

type UserRoleEnumValue = "ADMIN" | "TRADESMAN" | "MANAGER";

export const userRoleReverseMap: Record<UserRole, UserRoleEnumValue> = {
  admin: "ADMIN",
  tradesman: "TRADESMAN",
  manager: "MANAGER",
};

export const UserRoleEnum = builder.enumType("UserRole", {
  values: ["ADMIN", "TRADESMAN", "MANAGER"] as const,
});

export const SafeUserType = builder.objectRef<SafeUser>("SafeUser");

builder.objectType(SafeUserType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    email: t.exposeString("email"),
    name: t.exposeString("name"),
    role: t.field({
      type: UserRoleEnum,
      resolve: (parent) => userRoleReverseMap[parent.role],
    }),
    isActive: t.boolean({ resolve: (parent) => parent.is_active }),
    createdAt: t.string({ resolve: (parent) => parent.created_at }),
    updatedAt: t.string({ resolve: (parent) => parent.updated_at }),
  }),
});

export const AuthPayloadType = builder.objectRef<{ user: SafeUser }>("AuthPayload");

builder.objectType(AuthPayloadType, {
  fields: (t) => ({
    user: t.field({
      type: SafeUserType,
      resolve: (parent) => parent.user,
    }),
  }),
});

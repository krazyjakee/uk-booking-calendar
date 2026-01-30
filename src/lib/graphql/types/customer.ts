import builder from "../builder";
import type { Customer } from "@/lib/bookings/types";

export const CustomerType = builder.objectRef<Customer>("Customer");

builder.objectType(CustomerType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    email: t.exposeString("email"),
    name: t.exposeString("name"),
    phone: t.string({ resolve: (parent) => parent.phone, nullable: true }),
    postcode: t.string({ resolve: (parent) => parent.postcode, nullable: true }),
    created_at: t.exposeString("created_at"),
    updated_at: t.exposeString("updated_at"),
  }),
});

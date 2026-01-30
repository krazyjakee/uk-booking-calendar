import builder from "../builder";
import { UserRoleEnum } from "../types/user";

export const LoginInput = builder.inputType("LoginInput", {
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
  }),
});

export const RegisterInput = builder.inputType("RegisterInput", {
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
    name: t.string({ required: true }),
    role: t.field({ type: UserRoleEnum }),
  }),
});

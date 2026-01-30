import builder from "../builder";
import db from "@/lib/db";
import { GraphQLError } from "graphql";
import bcrypt from "bcryptjs";
import {
  verifyPassword,
  hashPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  validateEmail,
  validatePassword,
  validateName,
} from "@/lib/auth";
import { AuthPayloadType } from "../types/user";
import { userRoleMap } from "../types/user";
import { LoginInput, RegisterInput } from "../inputs/auth";
import type { User, SafeUser, UserRole } from "@/lib/auth/types";

// Pre-computed hash for timing-attack mitigation when user is not found
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

const VALID_ROLES: UserRole[] = ["admin", "tradesman", "manager"];

// --- login ---
builder.mutationField("login", (t) =>
  t.field({
    type: AuthPayloadType,
    args: {
      input: t.arg({ type: LoginInput, required: true }),
    },
    resolve: async (_, { input }) => {
      const emailError = validateEmail(input.email);
      if (emailError) throw new GraphQLError(emailError);

      const passwordError = validatePassword(input.password);
      if (passwordError) throw new GraphQLError(passwordError);

      const normalisedEmail = input.email.trim().toLowerCase();

      const user = await db("users")
        .where({ email: normalisedEmail })
        .first<User | undefined>();

      // Always compare against a hash to prevent timing attacks
      const hashToCompare = user?.password_hash ?? DUMMY_HASH;
      const passwordValid = await verifyPassword(input.password, hashToCompare);

      if (!user || !passwordValid) {
        throw new GraphQLError("Invalid email or password.");
      }

      if (!user.is_active) {
        throw new GraphQLError(
          "Account is deactivated. Contact your administrator."
        );
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

      const token = await signToken(safeUser);
      await setAuthCookie(token);

      return { user: safeUser };
    },
  })
);

// --- register ---
builder.mutationField("register", (t) =>
  t.field({
    type: AuthPayloadType,
    args: {
      input: t.arg({ type: RegisterInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      const emailError = validateEmail(input.email);
      if (emailError) throw new GraphQLError(emailError);

      const passwordError = validatePassword(input.password);
      if (passwordError) throw new GraphQLError(passwordError);

      const nameError = validateName(input.name);
      if (nameError) throw new GraphQLError(nameError);

      // Map GraphQL enum to DB value if provided
      const requestedRole = input.role
        ? userRoleMap[input.role]
        : undefined;

      if (requestedRole && !VALID_ROLES.includes(requestedRole)) {
        throw new GraphQLError(
          "Invalid role. Must be admin, tradesman, or manager."
        );
      }

      // Check authorisation: first-run bootstrap or admin-only
      const userCount = await db("users").count("id as count").first();
      const isFirstUser = Number(userCount?.count) === 0;

      let assignedRole: UserRole = "tradesman";

      if (isFirstUser) {
        assignedRole = "admin";
      } else {
        if (!ctx.user || ctx.user.role !== "admin") {
          throw new GraphQLError("Only administrators can create accounts.");
        }
        if (requestedRole) {
          assignedRole = requestedRole;
        }
      }

      const normalisedEmail = input.email.trim().toLowerCase();

      const existing = await db("users")
        .where({ email: normalisedEmail })
        .first<User | undefined>();

      if (existing) {
        throw new GraphQLError(
          "An account with this email already exists."
        );
      }

      const passwordHash = await hashPassword(input.password);

      const [inserted] = await db("users")
        .insert({
          email: normalisedEmail,
          password_hash: passwordHash,
          name: input.name.trim(),
          role: assignedRole,
          is_active: true,
        })
        .returning("*");

      const safeUser: SafeUser = {
        id: inserted.id,
        email: inserted.email,
        name: inserted.name,
        role: inserted.role,
        is_active: inserted.is_active,
        created_at: inserted.created_at,
        updated_at: inserted.updated_at,
      };

      return { user: safeUser };
    },
  })
);

// --- logout ---
builder.mutationField("logout", (t) =>
  t.field({
    type: "Boolean",
    resolve: async () => {
      await clearAuthCookie();
      return true;
    },
  })
);

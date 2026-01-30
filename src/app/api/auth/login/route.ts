import { NextRequest } from "next/server";
import db from "@/lib/db";
import {
  verifyPassword,
  signToken,
  setAuthCookie,
  validateEmail,
  validatePassword,
} from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/lib/api/response";
import type { User, SafeUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Pre-computed hash for timing-attack mitigation when user is not found
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const { email, password } = body;

  const emailError = validateEmail(email);
  if (emailError) return jsonError(emailError, 400);

  const passwordError = validatePassword(password);
  if (passwordError) return jsonError(passwordError, 400);

  const normalisedEmail = (email as string).trim().toLowerCase();

  const user = await db("users")
    .where({ email: normalisedEmail })
    .first<User | undefined>();

  // Always compare against a hash to prevent timing attacks
  const hashToCompare = user?.password_hash ?? DUMMY_HASH;
  const passwordValid = await verifyPassword(password as string, hashToCompare);

  if (!user || !passwordValid) {
    return jsonError("Invalid email or password.", 401);
  }

  if (!user.is_active) {
    return jsonError(
      "Account is deactivated. Contact your administrator.",
      401,
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

  return jsonSuccess({ user: safeUser });
}

import { NextRequest } from "next/server";
import db from "@/lib/db";
import {
  hashPassword,
  getCurrentUser,
  validateEmail,
  validatePassword,
  validateName,
} from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/lib/api/response";
import type { User, SafeUser, UserRole } from "@/lib/auth";

const VALID_ROLES: UserRole[] = ["admin", "tradesman", "manager"];

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const { email, password, name, role } = body;

  // Validate inputs
  const emailError = validateEmail(email);
  if (emailError) return jsonError(emailError, 400);

  const passwordError = validatePassword(password);
  if (passwordError) return jsonError(passwordError, 400);

  const nameError = validateName(name);
  if (nameError) return jsonError(nameError, 400);

  if (role !== undefined && !VALID_ROLES.includes(role as UserRole)) {
    return jsonError("Invalid role. Must be admin, tradesman, or manager.", 400);
  }

  // Check authorisation: first-run bootstrap or admin-only
  const userCount = await db("users").count("id as count").first();
  const isFirstUser = Number(userCount?.count) === 0;

  let assignedRole: UserRole = "tradesman";

  if (isFirstUser) {
    // First user is always admin
    assignedRole = "admin";
  } else {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return jsonError("Only administrators can create accounts.", 403);
    }
    // Admin can assign a specific role
    if (role) {
      assignedRole = role as UserRole;
    }
  }

  const normalisedEmail = (email as string).trim().toLowerCase();

  // Check for existing email
  const existing = await db("users")
    .where({ email: normalisedEmail })
    .first<User | undefined>();

  if (existing) {
    return jsonError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(password as string);

  const [inserted] = await db("users")
    .insert({
      email: normalisedEmail,
      password_hash: passwordHash,
      name: (name as string).trim(),
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

  return jsonSuccess({ user: safeUser }, 201);
}

import db from "@/lib/db";
import { getAuthCookie, verifyToken, clearAuthCookie } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/lib/api/response";
import type { User, SafeUser } from "@/lib/auth";

export async function GET() {
  const token = await getAuthCookie();
  if (!token) {
    return jsonError("Unauthorised.", 401);
  }

  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    await clearAuthCookie();
    return jsonError("Unauthorised.", 401);
  }

  const user = await db("users")
    .where({ id: payload.sub })
    .first<User | undefined>();

  if (!user || !user.is_active) {
    await clearAuthCookie();
    return jsonError("Unauthorised.", 401);
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

  return jsonSuccess({ user: safeUser });
}

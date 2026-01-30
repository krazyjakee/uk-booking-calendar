import { getAuthCookie } from "./cookies";
import { verifyToken } from "./jwt";
import type { JwtPayload, UserRole } from "./types";

export async function getCurrentUser(): Promise<JwtPayload | null> {
  const token = await getAuthCookie();
  if (!token) return null;

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<JwtPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorised");
  }
  return user;
}

export async function requireRole(
  ...roles: UserRole[]
): Promise<JwtPayload> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

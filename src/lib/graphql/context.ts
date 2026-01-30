import { verifyToken } from "@/lib/auth/jwt";
import { AUTH_CONFIG } from "@/lib/auth/config";
import type { GraphQLContext } from "./builder";

/**
 * Builds the GraphQL context from a Request object.
 * Extracts the auth cookie and verifies the JWT token.
 * Returns null user for unauthenticated requests (public queries allowed).
 */
export async function buildContext(request: Request): Promise<GraphQLContext> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return { user: null };
  }

  // Parse the auth cookie
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    })
  );

  const token = cookies[AUTH_CONFIG.cookieName];
  if (!token) {
    return { user: null };
  }

  try {
    const user = await verifyToken(token);
    return { user };
  } catch {
    return { user: null };
  }
}

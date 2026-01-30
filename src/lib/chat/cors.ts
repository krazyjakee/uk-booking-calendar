import db from "@/lib/db";

/**
 * Check whether the given origin is allowed for the specified tradesman.
 * In development mode, localhost origins are always permitted.
 */
export async function isOriginAllowed(
  tradesmanId: string,
  origin: string | null,
): Promise<boolean> {
  if (!origin) return false;

  // Allow localhost in development
  if (process.env.NODE_ENV === "development") {
    try {
      const url = new URL(origin);
      if (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "::1"
      ) {
        return true;
      }
    } catch {
      // Invalid origin URL
    }
  }

  // Extract domain from origin (strip protocol and port)
  let domain: string;
  try {
    const url = new URL(origin);
    domain = url.hostname.toLowerCase();
  } catch {
    return false;
  }

  const row = await db("allowed_domains")
    .where("tradesman_id", tradesmanId)
    .where("domain", domain)
    .where("is_active", true)
    .first<{ id: string } | undefined>();

  return !!row;
}

/**
 * Build CORS response headers for the given origin.
 */
export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

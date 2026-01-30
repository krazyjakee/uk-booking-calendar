import { clearAuthCookie } from "@/lib/auth";
import { jsonSuccess } from "@/lib/api/response";

export async function POST() {
  await clearAuthCookie();
  return jsonSuccess({ success: true });
}

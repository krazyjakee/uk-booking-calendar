import db from "@/lib/db";
import type { ChatbotSettings, FaqEntry } from "./types";

export async function getChatbotSettings(
  tradesmanId: string,
): Promise<ChatbotSettings | null> {
  const row = await db("chatbot_settings")
    .where("tradesman_id", tradesmanId)
    .first<ChatbotSettings | undefined>();
  return row ?? null;
}

export async function getTradesmanDisplayInfo(
  tradesmanId: string,
): Promise<{ name: string; businessName: string | null } | null> {
  const user = await db("users")
    .where("id", tradesmanId)
    .where("role", "tradesman")
    .where("is_active", true)
    .first<{ name: string } | undefined>();

  if (!user) return null;

  const profile = await db("tradesman_profiles")
    .where("user_id", tradesmanId)
    .first<{ business_name: string | null } | undefined>();

  return {
    name: user.name,
    businessName: profile?.business_name ?? null,
  };
}

export async function getFaqEntries(
  tradesmanId: string,
): Promise<FaqEntry[]> {
  return db("faq_entries")
    .where("tradesman_id", tradesmanId)
    .where("is_active", true)
    .orderBy("sort_order", "asc")
    .select<FaqEntry[]>();
}

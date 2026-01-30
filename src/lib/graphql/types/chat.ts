import builder from "../builder";
import type { FaqEntry, ChatMessage, ChatbotSettings, AllowedDomain } from "@/lib/chat/types";

// Safe chatbot settings type (hides encrypted API key)
interface SafeChatbotSettings extends Omit<ChatbotSettings, "gemini_api_key_encrypted" | "gemini_api_key_iv" | "gemini_api_key_tag"> {
  has_api_key: boolean;
}

export const FaqEntryType = builder.objectRef<FaqEntry>("FaqEntry");

builder.objectType(FaqEntryType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    tradesman_id: t.exposeString("tradesman_id"),
    question: t.exposeString("question"),
    answer: t.exposeString("answer"),
    category: t.string({ resolve: (p) => p.category, nullable: true }),
    sort_order: t.exposeInt("sort_order"),
    is_active: t.exposeBoolean("is_active"),
    created_at: t.exposeString("created_at"),
    updated_at: t.exposeString("updated_at"),
  }),
});

export const ChatMessageType = builder.objectRef<ChatMessage>("ChatMessage");

builder.objectType(ChatMessageType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    tradesman_id: t.exposeString("tradesman_id"),
    customer_name: t.exposeString("customer_name"),
    customer_email: t.exposeString("customer_email"),
    customer_phone: t.string({ resolve: (p) => p.customer_phone, nullable: true }),
    message: t.exposeString("message"),
    is_read: t.exposeBoolean("is_read"),
    created_at: t.exposeString("created_at"),
  }),
});

export const ChatbotSettingsType = builder.objectRef<SafeChatbotSettings>("ChatbotSettings");

builder.objectType(ChatbotSettingsType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    tradesman_id: t.exposeString("tradesman_id"),
    has_api_key: t.exposeBoolean("has_api_key"),
    greeting_message: t.exposeString("greeting_message"),
    system_prompt_override: t.string({ resolve: (p) => p.system_prompt_override, nullable: true }),
    model_name: t.exposeString("model_name"),
    is_active: t.exposeBoolean("is_active"),
    created_at: t.exposeString("created_at"),
    updated_at: t.exposeString("updated_at"),
  }),
});

export const AllowedDomainType = builder.objectRef<AllowedDomain>("AllowedDomain");

builder.objectType(AllowedDomainType, {
  fields: (t) => ({
    id: t.exposeString("id"),
    tradesman_id: t.exposeString("tradesman_id"),
    domain: t.exposeString("domain"),
    is_active: t.exposeBoolean("is_active"),
    created_at: t.exposeString("created_at"),
    updated_at: t.exposeString("updated_at"),
  }),
});

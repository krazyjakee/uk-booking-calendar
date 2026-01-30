export interface ChatbotSettings {
  id: string;
  tradesman_id: string;
  gemini_api_key_encrypted: string | null;
  gemini_api_key_iv: string | null;
  gemini_api_key_tag: string | null;
  greeting_message: string;
  system_prompt_override: string | null;
  model_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqEntry {
  id: string;
  tradesman_id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  tradesman_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AllowedDomain {
  id: string;
  tradesman_id: string;
  domain: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Chat session types (in-memory, not persisted)
export interface ChatSessionMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatSession {
  tradesman_id: string;
  messages: ChatSessionMessage[];
  created_at: number;
  last_activity: number;
  unresolved_count: number;
}

// SSE event types
export type ChatSSEEvent =
  | { type: "session"; data: string }
  | { type: "token"; data: string }
  | { type: "tool_call"; data: { name: string; args: Record<string, unknown> } }
  | { type: "tool_result"; data: { name: string; result: Record<string, unknown> } }
  | { type: "done"; data: null }
  | { type: "error"; data: string };

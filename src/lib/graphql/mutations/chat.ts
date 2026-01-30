import builder from "../builder";
import db from "@/lib/db";
import { FaqEntryType, ChatMessageType, ChatbotSettingsType, AllowedDomainType } from "../types/chat";
import { CreateFaqEntryInput, UpdateFaqEntryInput, UpdateChatbotSettingsInput, CreateAllowedDomainInput } from "../inputs/chat";
import { GraphQLError } from "graphql";
import { encryptApiKey } from "@/lib/chat/encryption";
import type { FaqEntry, ChatMessage, ChatbotSettings, AllowedDomain } from "@/lib/chat/types";

function assertAuth(ctx: { user: { sub: string; role: string } | null }): asserts ctx is { user: { sub: string; role: string } } {
  if (!ctx.user) throw new GraphQLError("Unauthorised.");
}

function assertTradesmanAccess(ctx: { user: { sub: string; role: string } }, tradesmanId: string): void {
  if (ctx.user.role === "tradesman" && ctx.user.sub !== tradesmanId) {
    throw new GraphQLError("Forbidden.");
  }
}

// --- FAQ Entry Mutations ---

builder.mutationField("createFaqEntry", (t) =>
  t.field({
    type: FaqEntryType,
    args: {
      input: t.arg({ type: CreateFaqEntryInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      assertAuth(ctx);
      assertTradesmanAccess(ctx, input.tradesman_id);

      if (!input.question?.trim()) throw new GraphQLError("Question is required.");
      if (!input.answer?.trim()) throw new GraphQLError("Answer is required.");

      const [entry] = await db("faq_entries")
        .insert({
          tradesman_id: input.tradesman_id,
          question: input.question.trim(),
          answer: input.answer.trim(),
          category: input.category?.trim() || null,
          sort_order: input.sort_order ?? 0,
        })
        .returning("*");

      return entry as FaqEntry;
    },
  })
);

builder.mutationField("updateFaqEntry", (t) =>
  t.field({
    type: FaqEntryType,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateFaqEntryInput, required: true }),
    },
    resolve: async (_, { id, input }, ctx) => {
      assertAuth(ctx);

      const existing = await db("faq_entries").where("id", id).first<FaqEntry | undefined>();
      if (!existing) throw new GraphQLError("FAQ entry not found.");

      assertTradesmanAccess(ctx, existing.tradesman_id);

      const updates: Record<string, unknown> = { updated_at: db.fn.now() };
      if (input.question !== undefined && input.question !== null) updates.question = input.question.trim();
      if (input.answer !== undefined && input.answer !== null) updates.answer = input.answer.trim();
      if (input.category !== undefined) updates.category = input.category?.trim() || null;
      if (input.sort_order !== undefined && input.sort_order !== null) updates.sort_order = input.sort_order;
      if (input.is_active !== undefined && input.is_active !== null) updates.is_active = input.is_active;

      await db("faq_entries").where("id", id).update(updates);

      return db("faq_entries").where("id", id).first<FaqEntry>();
    },
  })
);

builder.mutationField("deleteFaqEntry", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, { id }, ctx) => {
      assertAuth(ctx);

      const existing = await db("faq_entries").where("id", id).first<FaqEntry | undefined>();
      if (!existing) throw new GraphQLError("FAQ entry not found.");

      assertTradesmanAccess(ctx, existing.tradesman_id);

      await db("faq_entries").where("id", id).del();
      return true;
    },
  })
);

// --- Chatbot Settings Mutations ---

builder.mutationField("updateChatbotSettings", (t) =>
  t.field({
    type: ChatbotSettingsType,
    args: {
      tradesman_id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateChatbotSettingsInput, required: true }),
    },
    resolve: async (_, { tradesman_id, input }, ctx) => {
      assertAuth(ctx);
      assertTradesmanAccess(ctx, tradesman_id);

      // Ensure settings row exists
      let settings = await db("chatbot_settings")
        .where("tradesman_id", tradesman_id)
        .first<ChatbotSettings | undefined>();

      if (!settings) {
        await db("chatbot_settings").insert({ tradesman_id });
        settings = await db("chatbot_settings")
          .where("tradesman_id", tradesman_id)
          .first<ChatbotSettings>();
      }

      const updates: Record<string, unknown> = { updated_at: db.fn.now() };

      // Handle API key encryption
      if (input.gemini_api_key !== undefined && input.gemini_api_key !== null) {
        if (input.gemini_api_key.trim() === "") {
          // Clear the key
          updates.gemini_api_key_encrypted = null;
          updates.gemini_api_key_iv = null;
          updates.gemini_api_key_tag = null;
        } else {
          const { encrypted, iv, tag } = encryptApiKey(input.gemini_api_key.trim());
          updates.gemini_api_key_encrypted = encrypted;
          updates.gemini_api_key_iv = iv;
          updates.gemini_api_key_tag = tag;
        }
      }

      if (input.greeting_message !== undefined && input.greeting_message !== null) {
        updates.greeting_message = input.greeting_message.trim();
      }
      if (input.system_prompt_override !== undefined) {
        updates.system_prompt_override = input.system_prompt_override?.trim() || null;
      }
      if (input.model_name !== undefined && input.model_name !== null) {
        updates.model_name = input.model_name.trim();
      }
      if (input.is_active !== undefined && input.is_active !== null) {
        updates.is_active = input.is_active;
      }

      await db("chatbot_settings").where("tradesman_id", tradesman_id).update(updates);

      const updated = await db("chatbot_settings")
        .where("tradesman_id", tradesman_id)
        .first<ChatbotSettings>();

      return {
        ...updated!,
        has_api_key: !!updated!.gemini_api_key_encrypted,
      };
    },
  })
);

// --- Chat Message Mutations ---

builder.mutationField("markChatMessageRead", (t) =>
  t.field({
    type: ChatMessageType,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, { id }, ctx) => {
      assertAuth(ctx);

      const message = await db("chat_messages").where("id", id).first<ChatMessage | undefined>();
      if (!message) throw new GraphQLError("Message not found.");

      assertTradesmanAccess(ctx, message.tradesman_id);

      await db("chat_messages").where("id", id).update({ is_read: true });

      return db("chat_messages").where("id", id).first<ChatMessage>();
    },
  })
);

builder.mutationField("markAllChatMessagesRead", (t) =>
  t.field({
    type: "Int",
    args: {
      tradesman_id: t.arg.string({ required: true }),
    },
    resolve: async (_, { tradesman_id }, ctx) => {
      assertAuth(ctx);
      assertTradesmanAccess(ctx, tradesman_id);

      const count = await db("chat_messages")
        .where("tradesman_id", tradesman_id)
        .where("is_read", false)
        .update({ is_read: true });

      return count;
    },
  })
);

builder.mutationField("deleteChatMessage", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, { id }, ctx) => {
      assertAuth(ctx);

      const message = await db("chat_messages").where("id", id).first<ChatMessage | undefined>();
      if (!message) throw new GraphQLError("Message not found.");

      assertTradesmanAccess(ctx, message.tradesman_id);

      await db("chat_messages").where("id", id).del();
      return true;
    },
  })
);

// --- Allowed Domain Mutations ---

builder.mutationField("createAllowedDomain", (t) =>
  t.field({
    type: AllowedDomainType,
    args: {
      input: t.arg({ type: CreateAllowedDomainInput, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      assertAuth(ctx);
      assertTradesmanAccess(ctx, input.tradesman_id);

      // Normalise domain: lowercase, strip protocol and trailing slash
      let domain = input.domain.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

      if (!domain) throw new GraphQLError("Domain is required.");
      if (domain.length > 255) throw new GraphQLError("Domain must not exceed 255 characters.");

      // Check for duplicates
      const existing = await db("allowed_domains")
        .where("tradesman_id", input.tradesman_id)
        .where("domain", domain)
        .first<AllowedDomain | undefined>();

      if (existing) throw new GraphQLError("Domain already exists.");

      const [entry] = await db("allowed_domains")
        .insert({
          tradesman_id: input.tradesman_id,
          domain,
        })
        .returning("*");

      return entry as AllowedDomain;
    },
  })
);

builder.mutationField("updateAllowedDomain", (t) =>
  t.field({
    type: AllowedDomainType,
    args: {
      id: t.arg.string({ required: true }),
      is_active: t.arg.boolean({ required: true }),
    },
    resolve: async (_, { id, is_active }, ctx) => {
      assertAuth(ctx);

      const existing = await db("allowed_domains").where("id", id).first<AllowedDomain | undefined>();
      if (!existing) throw new GraphQLError("Domain not found.");

      assertTradesmanAccess(ctx, existing.tradesman_id);

      await db("allowed_domains").where("id", id).update({
        is_active,
        updated_at: db.fn.now(),
      });

      return db("allowed_domains").where("id", id).first<AllowedDomain>();
    },
  })
);

builder.mutationField("deleteAllowedDomain", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, { id }, ctx) => {
      assertAuth(ctx);

      const existing = await db("allowed_domains").where("id", id).first<AllowedDomain | undefined>();
      if (!existing) throw new GraphQLError("Domain not found.");

      assertTradesmanAccess(ctx, existing.tradesman_id);

      await db("allowed_domains").where("id", id).del();
      return true;
    },
  })
);

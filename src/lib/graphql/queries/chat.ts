import builder from "../builder";
import db from "@/lib/db";
import { FaqEntryType, ChatMessageType, ChatbotSettingsType, AllowedDomainType } from "../types/chat";
import { ChatMessageFilterInput } from "../inputs/chat";
import { GraphQLError } from "graphql";
import type { FaqEntry, ChatMessage, ChatbotSettings, AllowedDomain } from "@/lib/chat/types";

function assertAuth(ctx: { user: { sub: string; role: string } | null }): asserts ctx is { user: { sub: string; role: string } } {
  if (!ctx.user) throw new GraphQLError("Unauthorised.");
}

function assertTradesmanAccess(ctx: { user: { sub: string; role: string } }, tradesmanId: string): void {
  if (ctx.user.role === "tradesman" && ctx.user.sub !== tradesmanId) {
    throw new GraphQLError("Forbidden.");
  }
}

// FAQ entries
builder.queryField("faqEntries", (t) =>
  t.field({
    type: [FaqEntryType],
    args: {
      tradesman_id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      assertAuth(ctx);
      assertTradesmanAccess(ctx, args.tradesman_id);

      return db("faq_entries")
        .where("tradesman_id", args.tradesman_id)
        .orderBy("sort_order", "asc")
        .orderBy("created_at", "asc") as Promise<FaqEntry[]>;
    },
  })
);

// Chatbot settings
builder.queryField("chatbotSettings", (t) =>
  t.field({
    type: ChatbotSettingsType,
    nullable: true,
    args: {
      tradesman_id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      assertAuth(ctx);
      assertTradesmanAccess(ctx, args.tradesman_id);

      const settings = await db("chatbot_settings")
        .where("tradesman_id", args.tradesman_id)
        .first<ChatbotSettings | undefined>();

      if (!settings) return null;

      return {
        ...settings,
        has_api_key: !!settings.gemini_api_key_encrypted,
      };
    },
  })
);

// Chat messages (paginated)
builder.queryField("chatMessages", (t) =>
  t.field({
    type: [ChatMessageType],
    args: {
      filter: t.arg({ type: ChatMessageFilterInput, required: true }),
      page: t.arg.int({ defaultValue: 1 }),
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (_, { filter, page, limit }, ctx) => {
      assertAuth(ctx);
      assertTradesmanAccess(ctx, filter.tradesman_id);

      const offset = ((page ?? 1) - 1) * (limit ?? 20);
      const query = db("chat_messages")
        .where("tradesman_id", filter.tradesman_id)
        .orderBy("created_at", "desc")
        .limit(limit ?? 20)
        .offset(offset);

      if (filter.is_read !== undefined && filter.is_read !== null) {
        query.where("is_read", filter.is_read);
      }

      return query as Promise<ChatMessage[]>;
    },
  })
);

// Chat messages count
builder.queryField("chatMessagesCount", (t) =>
  t.field({
    type: "Int",
    args: {
      tradesman_id: t.arg.string({ required: true }),
      is_read: t.arg.boolean(),
    },
    resolve: async (_, args, ctx) => {
      assertAuth(ctx);
      assertTradesmanAccess(ctx, args.tradesman_id);

      const query = db("chat_messages")
        .where("tradesman_id", args.tradesman_id)
        .count("id as count");

      if (args.is_read !== undefined && args.is_read !== null) {
        query.where("is_read", args.is_read);
      }

      const [result] = await query;
      return (result as { count: number }).count;
    },
  })
);

// Allowed domains
builder.queryField("allowedDomains", (t) =>
  t.field({
    type: [AllowedDomainType],
    args: {
      tradesman_id: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      assertAuth(ctx);
      assertTradesmanAccess(ctx, args.tradesman_id);

      return db("allowed_domains")
        .where("tradesman_id", args.tradesman_id)
        .orderBy("domain", "asc") as Promise<AllowedDomain[]>;
    },
  })
);

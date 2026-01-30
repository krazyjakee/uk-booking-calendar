import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/chat/rate-limiter";
import { getChatbotSettings, getTradesmanDisplayInfo, getFaqEntries } from "@/lib/chat/settings";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { decryptApiKey } from "@/lib/chat/encryption";
import { streamChat } from "@/lib/chat/gemini";
import {
  createSession,
  getSession,
  addMessage,
} from "@/lib/chat/sessions";
import { chatToolDefinitions } from "@/lib/chat/tools";
import { executeToolCall } from "@/lib/chat/tool-executor";
import { isOriginAllowed, corsHeaders } from "@/lib/chat/cors";
import type { ChatSSEEvent } from "@/lib/chat/types";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

function formatSSEEvent(event: ChatSSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function OPTIONS(
  request: Request,
  { params }: { params: Promise<{ tradesmanId: string }> },
) {
  const { tradesmanId } = await params;
  const origin = request.headers.get("origin");

  if (!origin || !(await isOriginAllowed(tradesmanId, origin))) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tradesmanId: string }> },
) {
  const { tradesmanId } = await params;

  // CORS check
  const origin = request.headers.get("origin");
  const originAllowed = origin ? await isOriginAllowed(tradesmanId, origin) : false;
  // If there's a cross-origin request and it's not allowed, reject it
  if (origin && !originAllowed) {
    return NextResponse.json(
      { error: "Origin not allowed." },
      { status: 403 },
    );
  }

  // Rate limit check
  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
        },
      },
    );
  }

  // Parse request body
  let body: { session_id?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { session_id, message } = body;
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 },
    );
  }

  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Message must not exceed 2000 characters." },
      { status: 400 },
    );
  }

  // Validate tradesman and load settings
  const tradesmanInfo = await getTradesmanDisplayInfo(tradesmanId);
  if (!tradesmanInfo) {
    return NextResponse.json(
      { error: "Tradesman not found." },
      { status: 404 },
    );
  }

  const settings = await getChatbotSettings(tradesmanId);
  if (settings && !settings.is_active) {
    return NextResponse.json(
      { error: "Chat is currently unavailable." },
      { status: 503 },
    );
  }

  // Resolve Gemini API key
  let apiKey: string | null = null;
  if (settings?.gemini_api_key_encrypted && settings.gemini_api_key_iv && settings.gemini_api_key_tag) {
    try {
      apiKey = decryptApiKey(
        settings.gemini_api_key_encrypted,
        settings.gemini_api_key_iv,
        settings.gemini_api_key_tag,
      );
    } catch {
      // Fall through to environment variable
    }
  }
  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY ?? null;
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chat is not configured. Please contact the tradesman." },
      { status: 503 },
    );
  }

  // Get or create session
  let currentSessionId = session_id ?? null;
  let session = currentSessionId ? getSession(currentSessionId) : undefined;

  if (!session) {
    currentSessionId = createSession(tradesmanId);
    session = getSession(currentSessionId)!;
  }

  // Add user message to session history
  addMessage(currentSessionId!, { role: "user", content: message.trim() });

  // Build system prompt with FAQ context
  const faqEntries = await getFaqEntries(tradesmanId);
  const modelName = settings?.model_name ?? "gemini-2.0-flash";
  const systemPrompt = buildSystemPrompt(
    tradesmanInfo.name,
    tradesmanInfo.businessName,
    faqEntries,
    settings?.system_prompt_override ?? null,
  );

  // Stream the response as SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send session ID first
      controller.enqueue(
        encoder.encode(
          formatSSEEvent({ type: "session", data: currentSessionId! }),
        ),
      );

      let fullResponse = "";

      try {
        const events = streamChat({
          apiKey: apiKey!,
          model: modelName,
          systemPrompt,
          history: session!.messages.slice(0, -1), // Exclude the latest user message (already sent)
          userMessage: message.trim(),
          tools: chatToolDefinitions,
          executeToolCall: (name, args) =>
            executeToolCall(name, args, tradesmanId),
        });

        for await (const event of events) {
          if (event.type === "token") {
            fullResponse += event.data;
          }
          controller.enqueue(encoder.encode(formatSSEEvent(event)));
        }

        // Add model response to session history
        if (fullResponse) {
          addMessage(currentSessionId!, { role: "model", content: fullResponse });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unexpected error occurred.";
        controller.enqueue(
          encoder.encode(formatSSEEvent({ type: "error", data: errorMessage })),
        );
      } finally {
        controller.close();
      }
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Connection": "keep-alive",
  };

  if (origin && originAllowed) {
    Object.assign(headers, corsHeaders(origin));
  }

  return new Response(stream, { headers });
}

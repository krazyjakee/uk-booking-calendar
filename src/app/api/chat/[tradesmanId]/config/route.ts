import { NextRequest, NextResponse } from "next/server";
import {
  getChatbotSettings,
  getTradesmanDisplayInfo,
} from "@/lib/chat/settings";
import { isOriginAllowed, corsHeaders } from "@/lib/chat/cors";

export async function OPTIONS(
  request: NextRequest,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tradesmanId: string }> },
) {
  const { tradesmanId } = await params;

  // CORS check
  const origin = request.headers.get("origin");
  const originAllowed = origin
    ? await isOriginAllowed(tradesmanId, origin)
    : false;

  if (origin && !originAllowed) {
    return NextResponse.json(
      { error: "Origin not allowed." },
      { status: 403 },
    );
  }

  const [settings, info] = await Promise.all([
    getChatbotSettings(tradesmanId),
    getTradesmanDisplayInfo(tradesmanId),
  ]);

  if (!info) {
    return NextResponse.json(
      { error: "Tradesman not found" },
      { status: 404 },
    );
  }

  const responseHeaders: Record<string, string> = {};
  if (origin && originAllowed) {
    Object.assign(responseHeaders, corsHeaders(origin));
  }

  return NextResponse.json(
    {
      greeting:
        settings?.greeting_message ?? "Hello! How can I help you today?",
      businessName: info.businessName ?? info.name,
      isActive: settings?.is_active ?? false,
    },
    { headers: responseHeaders },
  );
}

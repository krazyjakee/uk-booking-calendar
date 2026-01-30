import { randomUUID } from "crypto";
import type { ChatSession, ChatSessionMessage } from "./types";

const sessions = new Map<string, ChatSession>();

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function createSession(tradesmanId: string): string {
  const sessionId = randomUUID();
  const now = Date.now();

  sessions.set(sessionId, {
    tradesman_id: tradesmanId,
    messages: [],
    created_at: now,
    last_activity: now,
    unresolved_count: 0,
  });

  return sessionId;
}

export function getSession(sessionId: string): ChatSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  // Check if session has expired
  if (Date.now() - session.last_activity > SESSION_TIMEOUT_MS) {
    sessions.delete(sessionId);
    return undefined;
  }

  return session;
}

export function addMessage(
  sessionId: string,
  message: ChatSessionMessage,
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.messages.push(message);
  session.last_activity = Date.now();
}

export function incrementUnresolved(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.unresolved_count += 1;
}

export function resetUnresolved(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.unresolved_count = 0;
}

export function getUnresolvedCount(sessionId: string): number {
  const session = sessions.get(sessionId);
  return session?.unresolved_count ?? 0;
}

export function cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.last_activity > SESSION_TIMEOUT_MS) {
      sessions.delete(id);
    }
  }
}

// Start periodic cleanup
if (typeof globalThis !== "undefined") {
  const interval = setInterval(cleanupStaleSessions, CLEANUP_INTERVAL_MS);
  // Allow the process to exit naturally
  if (interval.unref) {
    interval.unref();
  }
}

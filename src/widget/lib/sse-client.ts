export interface SSEEvent {
  type: "session" | "token" | "tool_call" | "tool_result" | "done" | "error";
  data: unknown;
}

export interface SSECallbacks {
  onSession?: (sessionId: string) => void;
  onToken?: (token: string) => void;
  onToolCall?: (data: { name: string; args: Record<string, unknown> }) => void;
  onToolResult?: (data: {
    name: string;
    result: Record<string, unknown>;
  }) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

export async function sendMessage(
  apiBase: string,
  tradesmanId: string,
  message: string,
  sessionId: string | null,
  callbacks: SSECallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const url = `${apiBase}/api/chat/${tradesmanId}`;
  const body: Record<string, string> = { message };
  if (sessionId) body.session_id = sessionId;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Request failed");
    callbacks.onError?.(text);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError?.("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const event: SSEEvent = JSON.parse(jsonStr);
          switch (event.type) {
            case "session":
              callbacks.onSession?.(event.data as string);
              break;
            case "token":
              callbacks.onToken?.(event.data as string);
              break;
            case "tool_call":
              callbacks.onToolCall?.(
                event.data as {
                  name: string;
                  args: Record<string, unknown>;
                },
              );
              break;
            case "tool_result":
              callbacks.onToolResult?.(
                event.data as {
                  name: string;
                  result: Record<string, unknown>;
                },
              );
              break;
            case "done":
              callbacks.onDone?.();
              break;
            case "error":
              callbacks.onError?.(event.data as string);
              break;
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

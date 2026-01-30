import { useState, useCallback, useRef } from "preact/hooks";
import { ChatButton } from "./ChatButton";
import { ChatPanel, type Message } from "./ChatPanel";
import { sendMessage } from "../lib/sse-client";

interface ChatWidgetProps {
  tradesmanId: string;
  apiBase: string;
  position: "bottom-right" | "bottom-left";
  greeting: string;
  businessName: string;
}

export function ChatWidget({
  tradesmanId,
  apiBase,
  position,
  greeting,
  businessName,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const initialisedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const posClass =
    position === "bottom-left" ? "ukbc-widget--left" : "ukbc-widget--right";

  function toggle() {
    const opening = !isOpen;
    setIsOpen(opening);

    if (opening && !initialisedRef.current) {
      initialisedRef.current = true;
      if (greeting) {
        setMessages([{ role: "bot", text: greeting }]);
      }
    }
  }

  const handleSend = useCallback(
    (text: string) => {
      setMessages((prev) => [...prev, { role: "user", text }]);
      setStreaming(true);

      let botText = "";
      const controller = new AbortController();
      abortRef.current = controller;

      sendMessage(apiBase, tradesmanId, text, sessionIdRef.current, {
        onSession(id) {
          sessionIdRef.current = id;
        },
        onToken(token) {
          botText += token;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "bot" && streaming) {
              return [...prev.slice(0, -1), { role: "bot", text: botText }];
            }
            return [...prev, { role: "bot", text: botText }];
          });
        },
        onDone() {
          setStreaming(false);
          abortRef.current = null;
        },
        onError(msg) {
          setStreaming(false);
          abortRef.current = null;
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              text: "Sorry, something went wrong. Please try again.",
            },
          ]);
          console.error("[ukbc-widget]", msg);
        },
      }, controller.signal).catch(() => {
        setStreaming(false);
      });
    },
    [apiBase, tradesmanId, streaming],
  );

  return (
    <div class={`ukbc-widget ${posClass}`}>
      {isOpen && (
        <ChatPanel
          businessName={businessName}
          messages={messages}
          streaming={streaming}
          onClose={() => setIsOpen(false)}
          onSend={handleSend}
        />
      )}
      <ChatButton onClick={toggle} isOpen={isOpen} />
    </div>
  );
}

import { useRef, useEffect } from "preact/hooks";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export interface Message {
  role: "user" | "bot";
  text: string;
}

interface ChatPanelProps {
  businessName: string;
  messages: Message[];
  streaming: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}

export function ChatPanel({
  businessName,
  messages,
  streaming,
  onClose,
  onSend,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const el = inputRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || streaming) return;
    el.value = "";
    onSend(text);
  }

  return (
    <div class="ukbc-panel">
      <ChatHeader businessName={businessName} onClose={onClose} />
      <div class="ukbc-messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} text={msg.text} />
        ))}
        {streaming && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <div class="ukbc-input-area">
        <textarea
          ref={inputRef}
          class="ukbc-input"
          placeholder="Type a message…"
          rows={1}
          onKeyDown={handleKeyDown}
        />
        <button
          class="ukbc-send"
          onClick={submit}
          disabled={streaming}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  role: "user" | "bot";
  text: string;
}

export function MessageBubble({ role, text }: MessageBubbleProps) {
  return (
    <div class={`ukbc-msg ukbc-msg--${role}`}>
      {text}
    </div>
  );
}

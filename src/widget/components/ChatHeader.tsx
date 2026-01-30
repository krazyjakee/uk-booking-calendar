interface ChatHeaderProps {
  businessName: string;
  onClose: () => void;
}

export function ChatHeader({ businessName, onClose }: ChatHeaderProps) {
  return (
    <div class="ukbc-header">
      <span class="ukbc-header-title">{businessName}</span>
      <button class="ukbc-header-close" onClick={onClose} aria-label="Close chat">
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

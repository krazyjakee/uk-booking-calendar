export const WIDGET_CSS = /* css */ `
  :host {
    --accent: #1E3A5F;
    --accent-fg: #ffffff;
    --bg: #ffffff;
    --bg-muted: #f4f4f5;
    --fg: #09090b;
    --fg-muted: #71717a;
    --border: #e4e4e7;
    --radius: 12px;
    --shadow: 0 8px 30px rgba(0,0,0,0.12);
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

    all: initial;
    font-family: var(--font);
    font-size: 14px;
    line-height: 1.5;
    color: var(--fg);
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .ukbc-widget {
    position: fixed;
    bottom: 20px;
    z-index: 2147483647;
  }

  .ukbc-widget--right {
    right: 20px;
  }

  .ukbc-widget--left {
    left: 20px;
  }

  /* Floating button */
  .ukbc-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: var(--accent-fg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .ukbc-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 40px rgba(0,0,0,0.18);
  }

  .ukbc-btn svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Chat panel */
  .ukbc-panel {
    position: absolute;
    bottom: 70px;
    width: 380px;
    height: 520px;
    background: var(--bg);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: ukbc-slide-up 0.25s ease-out;
  }

  .ukbc-widget--right .ukbc-panel {
    right: 0;
  }

  .ukbc-widget--left .ukbc-panel {
    left: 0;
  }

  @keyframes ukbc-slide-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Header */
  .ukbc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--accent);
    color: var(--accent-fg);
  }

  .ukbc-header-title {
    font-weight: 600;
    font-size: 15px;
  }

  .ukbc-header-close {
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(255,255,255,0.15);
    color: var(--accent-fg);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ukbc-header-close:hover {
    background: rgba(255,255,255,0.25);
  }

  .ukbc-header-close svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Messages area */
  .ukbc-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ukbc-msg {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .ukbc-msg--bot {
    align-self: flex-start;
    background: var(--bg-muted);
    color: var(--fg);
    border-bottom-left-radius: 4px;
  }

  .ukbc-msg--user {
    align-self: flex-end;
    background: var(--accent);
    color: var(--accent-fg);
    border-bottom-right-radius: 4px;
  }

  /* Typing indicator */
  .ukbc-typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 14px;
    align-self: flex-start;
  }

  .ukbc-typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--fg-muted);
    animation: ukbc-bounce 1.4s ease-in-out infinite;
  }

  .ukbc-typing-dot:nth-child(2) {
    animation-delay: 0.16s;
  }

  .ukbc-typing-dot:nth-child(3) {
    animation-delay: 0.32s;
  }

  @keyframes ukbc-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }

  /* Input area */
  .ukbc-input-area {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    background: var(--bg);
  }

  .ukbc-input {
    flex: 1;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: var(--font);
    font-size: 14px;
    color: var(--fg);
    background: var(--bg);
    outline: none;
    resize: none;
    min-height: 38px;
    max-height: 100px;
  }

  .ukbc-input:focus {
    border-color: var(--accent);
  }

  .ukbc-input::placeholder {
    color: var(--fg-muted);
  }

  .ukbc-send {
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 8px;
    background: var(--accent);
    color: var(--accent-fg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }

  .ukbc-send:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .ukbc-send svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Mobile full-screen */
  @media (max-width: 639px) {
    .ukbc-panel {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      border-radius: 0;
    }
  }
`;

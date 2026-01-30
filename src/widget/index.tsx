import { render } from "preact";
import { ChatWidget } from "./components/ChatWidget";
import { WIDGET_CSS } from "./styles";

(function () {
  const scriptTag = document.currentScript as HTMLScriptElement | null;
  if (!scriptTag) return;

  const tradesmanId = scriptTag.getAttribute("data-tradesman-id");
  if (!tradesmanId) {
    console.error("[ukbc-widget] Missing data-tradesman-id attribute");
    return;
  }

  const position =
    (scriptTag.getAttribute("data-position") as
      | "bottom-right"
      | "bottom-left") ?? "bottom-right";
  const accentColour = scriptTag.getAttribute("data-accent-colour");
  const customGreeting = scriptTag.getAttribute("data-greeting");

  // Derive apiBase from the script src URL
  const scriptSrc = scriptTag.src;
  const apiBase = scriptSrc
    ? new URL(scriptSrc).origin
    : window.location.origin;

  // Create shadow DOM host
  const host = document.createElement("div");
  host.id = "ukbc-chat-widget";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Inject styles
  const styleEl = document.createElement("style");
  let css = WIDGET_CSS;
  if (accentColour) {
    css = css.replace(/--accent:\s*#[0-9a-fA-F]+/, `--accent: ${accentColour}`);
  }
  styleEl.textContent = css;
  shadow.appendChild(styleEl);

  // Render container
  const container = document.createElement("div");
  shadow.appendChild(container);

  // Fetch config and render
  const defaultGreeting = "Hello! How can I help you today?";
  const defaultBusinessName = "Chat";

  async function init() {
    let greeting = customGreeting ?? defaultGreeting;
    let businessName = defaultBusinessName;

    try {
      const res = await fetch(`${apiBase}/api/chat/${tradesmanId}/config`);
      if (res.ok) {
        const config = await res.json();
        if (!customGreeting && config.greeting) greeting = config.greeting;
        if (config.businessName) businessName = config.businessName;
        if (config.isActive === false) return; // Widget disabled
      }
    } catch {
      // Use defaults on failure
    }

    render(
      <ChatWidget
        tradesmanId={tradesmanId!}
        apiBase={apiBase}
        position={position}
        greeting={greeting}
        businessName={businessName}
      />,
      container,
    );
  }

  init();
})();

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = "turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";

/** Managed widget dimensions — reserve this space up front to avoid CLS. */
export const TURNSTILE_WIDGET_HEIGHT_PX = 65;
export const TURNSTILE_WIDGET_WIDTH_PX = 300;

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    window.onTurnstileLoad = resolve;
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
  onWidgetReady: (widgetId: string) => void;
}

export function TurnstileWidget({ siteKey, onTokenChange, onWidgetReady }: TurnstileWidgetProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const onWidgetReadyRef = useRef(onWidgetReady);
  const [scale, setScale] = useState(1);
  onTokenChangeRef.current = onTokenChange;
  onWidgetReadyRef.current = onWidgetReady;

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    const updateScale = () => {
      const width = slot.clientWidth;
      setScale(width < TURNSTILE_WIDGET_WIDTH_PX ? width / TURNSTILE_WIDGET_WIDTH_PX : 1);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;

      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        size: "normal",
        callback: (token) => onTokenChangeRef.current(token),
        "error-callback": () => onTokenChangeRef.current(null),
        "expired-callback": () => onTokenChangeRef.current(null),
      });
      onWidgetReadyRef.current(widgetId);
    });

    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  return (
    <div
      ref={slotRef}
      className="w-full overflow-hidden"
      style={{ height: TURNSTILE_WIDGET_HEIGHT_PX }}
    >
      <div
        ref={containerRef}
        className="origin-top-left"
        style={{
          width: TURNSTILE_WIDGET_WIDTH_PX,
          height: TURNSTILE_WIDGET_HEIGHT_PX,
          transform: scale < 1 ? `scale(${scale})` : undefined,
        }}
      />
    </div>
  );
}

export function resetTurnstile(widgetId: string | null): void {
  if (widgetId && window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; theme?: "light" | "dark" },
      ) => number;
      getResponse: (widgetId: number) => string;
      reset: (widgetId: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const SCRIPT_ID = "recaptcha-script";

function loadRecaptchaScript(): Promise<void> {
  if (window.grecaptcha) return Promise.resolve();
  if (document.getElementById(SCRIPT_ID)) {
    return new Promise((resolve) => {
      window.onRecaptchaLoad = resolve;
    });
  }

  return new Promise((resolve) => {
    window.onRecaptchaLoad = resolve;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

interface RecaptchaCheckboxProps {
  siteKey: string;
  onWidgetReady: (widgetId: number) => void;
}

export function RecaptchaCheckbox({ siteKey, onWidgetReady }: RecaptchaCheckboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRecaptchaScript().then(() => {
      if (!containerRef.current || !window.grecaptcha) return;
      const widgetId = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
      });
      onWidgetReady(widgetId);
    });
  }, [siteKey, onWidgetReady]);

  return <div ref={containerRef} className="min-h-[78px]" />;
}

export function getRecaptchaToken(widgetId: number | null): string | null {
  if (widgetId === null || !window.grecaptcha) return null;
  const response = window.grecaptcha.getResponse(widgetId);
  return response.length > 0 ? response : null;
}

export function resetRecaptcha(widgetId: number | null): void {
  if (widgetId === null || !window.grecaptcha) return;
  window.grecaptcha.reset(widgetId);
}

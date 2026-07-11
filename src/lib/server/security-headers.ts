import { createMiddleware } from "@tanstack/react-start";

/**
 * Builds a Content-Security-Policy string. Supabase endpoints must be reachable
 * for data, auth and realtime, so they are added to `connect-src` explicitly.
 *
 * The dev policy is intentionally looser: Vite relies on inline/eval scripts and
 * a websocket connection for HMR that a strict production policy would block.
 */
function buildContentSecurityPolicy(options: {
  isDev: boolean;
  supabaseOrigin: string | null;
}): string {
  const { isDev, supabaseOrigin } = options;

  const connectSrc = ["'self'"];
  if (supabaseOrigin) {
    connectSrc.push(supabaseOrigin);
    connectSrc.push(supabaseOrigin.replace(/^http/, "ws"));
  }
  if (isDev) {
    connectSrc.push("ws:", "wss:");
  }

  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const directives: Array<[string, Array<string>]> = [
    ["default-src", ["'self'"]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'"]],
    ["script-src", scriptSrc],
    ["style-src", ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]],
    ["font-src", ["'self'", "https://fonts.gstatic.com", "data:"]],
    ["img-src", ["'self'", "data:", "blob:"]],
    ["connect-src", connectSrc],
    ["worker-src", ["'self'", "blob:"]],
    ["manifest-src", ["'self'"]],
  ];

  const policy = directives.map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) {
    policy.push("upgrade-insecure-requests");
  }

  return policy.join("; ");
}

function supabaseOrigin(): string | null {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url) {
    return null;
  }
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Global request middleware that applies defense-in-depth HTTP headers to every
 * response. Kept as a single source of truth so security posture is auditable.
 */
export const securityHeadersMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    const result = await next();
    const headers = result.response.headers;
    const isDev = process.env.NODE_ENV !== "production";

    headers.set(
      "Content-Security-Policy",
      buildContentSecurityPolicy({ isDev, supabaseOrigin: supabaseOrigin() }),
    );
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-DNS-Prefetch-Control", "off");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
    headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    );

    if (!isDev) {
      headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }

    return result;
  },
);

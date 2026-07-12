import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { securityHeadersMiddleware } from "@/lib/server/security-headers";

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

/**
 * Global Start instance. Registers request middleware that runs for every
 * incoming request (page loads and server-function RPCs alike).
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware, csrfMiddleware],
}));

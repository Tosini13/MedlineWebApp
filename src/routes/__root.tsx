import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/app/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { type AppUser, fetchCurrentUser } from "@/features/auth/auth.api";
import appCss from "@/styles/app.css?url";

export interface RootContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootContext>()({
  beforeLoad: async (): Promise<{ user: AppUser | null }> => {
    const user = await fetchCurrentUser();
    return { user };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { name: "color-scheme", content: "light dark" },
      { title: "Medline — your medical timeline" },
      {
        name: "description",
        content:
          "Medline keeps your medical history organised as clear, secure timelines of appointments, tests, and documents.",
      },
      { name: "application-name", content: "Medline" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Medline" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icons/icon.svg", type: "image/svg+xml" },
      {
        rel: "icon",
        href: "/icons/light/favicon.ico",
        media: "(prefers-color-scheme: light)",
      },
      {
        rel: "icon",
        href: "/icons/light/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        rel: "icon",
        href: "/icons/light/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        rel: "apple-touch-icon",
        href: "/icons/light/apple-touch-icon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        rel: "icon",
        href: "/icons/dark/favicon.ico",
        media: "(prefers-color-scheme: dark)",
      },
      {
        rel: "icon",
        href: "/icons/dark/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        rel: "icon",
        href: "/icons/dark/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        rel: "apple-touch-icon",
        href: "/icons/dark/apple-touch-icon.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lexend:wght@500;600;700&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Outlet />
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="min-h-dvh" suppressHydrationWarning>
      <head>
        <HeadContent />
        <meta name="theme-color" content="#FAFBFC" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#272A32" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="flex min-h-dvh flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <Scripts />
      </body>
    </html>
  );
}

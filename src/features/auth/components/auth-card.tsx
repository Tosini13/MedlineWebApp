import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Brand } from "@/components/app/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-10%,var(--color-accent),transparent)] opacity-70"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <Brand />
          </Link>
        </div>
        <Card className="border-border/60 shadow-lg shadow-black/5">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </main>
  );
}

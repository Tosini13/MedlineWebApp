const DEFAULT_ADMIN_EMAIL = "jakub.bartosik.work@gmail.com";

export async function notifyAdminNewSignup({ email }: { email: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL ?? DEFAULT_ADMIN_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey) {
    console.warn("[admin-notify] RESEND_API_KEY not set — skipping signup notification.");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Medline: new signup pending approval",
      text: [
        "A new user signed up and is waiting for approval.",
        "",
        `Email: ${email}`,
        `Time: ${new Date().toISOString()}`,
        "",
        `Approve with: pnpm approve-user --email ${email}`,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    console.error("[admin-notify] Failed to send signup notification:", await response.text());
  }
}

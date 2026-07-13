interface RecaptchaVerifyResponse {
  success: boolean;
}

export async function verifyRecaptchaToken(token: string, secretKey: string): Promise<boolean> {
  const body = new URLSearchParams({ secret: secretKey, response: token });
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) return false;

  const data = (await response.json()) as RecaptchaVerifyResponse;
  return data.success === true;
}

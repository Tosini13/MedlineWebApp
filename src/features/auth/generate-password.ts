const PASSWORD_CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*-_=+",
} as const;

function pickRandomChar(charset: string): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return charset[values[0]! % charset.length]!;
}

/** Generates a password with at least one character from each required class. */
export function generateSecurePassword(length = 16): string {
  const all =
    PASSWORD_CHARSETS.upper +
    PASSWORD_CHARSETS.lower +
    PASSWORD_CHARSETS.digits +
    PASSWORD_CHARSETS.symbols;
  const len = Math.min(Math.max(length, 8), 128);

  const chars = [
    pickRandomChar(PASSWORD_CHARSETS.upper),
    pickRandomChar(PASSWORD_CHARSETS.lower),
    pickRandomChar(PASSWORD_CHARSETS.digits),
    pickRandomChar(PASSWORD_CHARSETS.symbols),
  ];

  while (chars.length < len) {
    chars.push(pickRandomChar(all));
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const j = values[0]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}

import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeTokenEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

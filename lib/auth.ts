import crypto from "crypto";
export { SESSION_COOKIE } from "./constants";

const ITERATIONS = 10000;
const KEYLEN = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"));
}

export function createSessionToken(userId: string): string {
  const secret = process.env.AUTH_SECRET!;
  const sig = crypto.createHmac("sha256", secret).update(userId).digest("hex");
  return Buffer.from(`${userId}.${sig}`).toString("base64url");
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) return null;
    const userId = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const secret = process.env.AUTH_SECRET!;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(userId)
      .digest("hex");
    if (sig !== expected) return null;
    return userId;
  } catch {
    return null;
  }
}


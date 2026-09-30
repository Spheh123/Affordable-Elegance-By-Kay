import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_HOURS = 12;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function hasAdminPassword() {
  return Boolean(process.env.ADMIN_PASSWORD && secret());
}

export function passwordMatches(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || password.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
}

export function createAdminToken() {
  const payload = toBase64Url(JSON.stringify({
    role: "admin",
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000
  }));
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminToken(token = "") {
  const [payload, signed] = token.split(".");
  if (!payload || !signed || !secret()) return false;

  const expected = signature(payload);
  if (expected.length !== signed.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signed))) {
    return false;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload));
    return parsed.role === "admin" && Number(parsed.exp) > Date.now();
  } catch {
    return false;
  }
}

export function isAdminRequest(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  return verifyAdminToken(token);
}

export function authError(message = "Admin password required.", status = 401) {
  return Response.json({ error: message }, { status });
}

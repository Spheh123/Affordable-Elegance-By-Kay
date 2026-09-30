import type { Config } from "@netlify/functions";
import { createAdminToken, hasAdminPassword, passwordMatches } from "./_shared/admin-auth.mts";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!hasAdminPassword()) {
    return Response.json({ error: "Admin password is not configured yet." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  if (!passwordMatches(String(body.password || ""))) {
    return Response.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  return Response.json({ ok: true, token: createAdminToken() });
};

export const config: Config = {
  path: "/api/admin-login",
  method: "POST"
};

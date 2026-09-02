import type { Config } from "@netlify/functions";
import { getState, setState } from "./_shared/state-store.mts";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export default async (req: Request) => {
  if (req.method === "GET") return json(await getState());

  if (req.method === "PUT") {
    const state = await req.json();
    await setState(state);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config: Config = {
  path: "/api/data",
  method: ["GET", "PUT"]
};

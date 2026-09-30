import type { Config } from "@netlify/functions";
import { authError, isAdminRequest } from "./_shared/admin-auth.mts";
import { getState, setState } from "./_shared/state-store.mts";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function publicState(state: any) {
  return {
    ...state,
    bookings: (state.bookings || []).map((booking: any) => ({
      id: booking.id,
      branchId: booking.branchId,
      date: booking.date,
      time: booking.time,
      duration: booking.duration,
      status: booking.status
    }))
  };
}

export default async (req: Request) => {
  if (req.method === "GET") {
    const state = await getState();
    return json(isAdminRequest(req) ? state : publicState(state));
  }

  if (req.method === "PUT") {
    if (!isAdminRequest(req)) return authError();
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

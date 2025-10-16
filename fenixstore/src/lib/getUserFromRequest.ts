import { verify } from "./jwt";
import { supabaseAdmin } from "./supabaseServer";

export async function getUserFromRequest(req: Request) {
  // In App Router route handlers, cookies are available via req.headers.get("cookie")
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/fenix_token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  const payload = verify(token);
  if (!payload || !payload.sub) return null;
  const steamId = String(payload.sub);

  // fetch user from supabase
  const { data } = await supabaseAdmin.from("users").select("*").eq("id", steamId).single();
  return data ?? { id: steamId };
}

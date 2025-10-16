// app/api/auth/steam/login/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const realm = process.env.STEAM_REALM || "http://localhost:3000";
  const return_to = process.env.STEAM_RETURN_URL || `${realm}/api/auth/steam/callback`;

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": return_to,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const redirectUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;
  return NextResponse.redirect(redirectUrl);
}

// pages/api/auth/steam/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import { RelyingParty } from "openid";

const REALM = process.env.STEAM_REALM || "http://localhost:3000";
const RETURN_TO = process.env.STEAM_RETURN_URL || `${REALM}/api/auth/steam/callback`;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const relyingParty = new RelyingParty(
    RETURN_TO,
    REALM,
    true,
    false,
    []
  );

  relyingParty.authenticate("https://steamcommunity.com/openid", false, (err: any, authUrl?: string) => {
    if (err || !authUrl) {
      console.error("OpenID auth error:", err);
      return res.status(500).send("Erro ao iniciar autenticação Steam");
    }
    res.redirect(302, authUrl);
  });
}

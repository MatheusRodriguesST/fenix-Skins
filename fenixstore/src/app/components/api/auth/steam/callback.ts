// pages/api/auth/steam/callback.ts
import { NextApiRequest, NextApiResponse } from "next";
import { RelyingParty } from "openid";
import jwt from "jsonwebtoken";

const REALM = process.env.STEAM_REALM || "http://localhost:3000";
const RETURN_TO = process.env.STEAM_RETURN_URL || `${REALM}/api/auth/steam/callback`;
const JWT_SECRET = process.env.JWT_SECRET || "troque_essa_senha";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const relyingParty = new RelyingParty(
    RETURN_TO,
    REALM,
    true,
    false,
    []
  );

  relyingParty.verifyAssertion(req, async (err: any, result: any) => {
    if (err || !result || !result.claimedIdentifier) {
      console.error("OpenID verify error:", err);
      return res.status(401).send("Falha na autenticação Steam");
    }

    const claimed: string = result.claimedIdentifier;
    // claimed example: https://steamcommunity.com/openid/id/765611980...
    const parts = claimed.split("/");
    const steamId = parts[parts.length - 1];

    // você pode buscar player info aqui (avatar) se quiser

    const token = jwt.sign({ steamId }, JWT_SECRET, { expiresIn: "7d" });

    // Cookie (HttpOnly). Em produção ajuste Secure, SameSite etc.
    res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax`);
    res.redirect("/");
  });
}

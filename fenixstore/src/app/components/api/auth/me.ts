// pages/api/auth/me.ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const JWT_SECRET = process.env.JWT_SECRET || "";
const STEAM_API_KEY = process.env.STEAM_API_KEY || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    const steamId = payload.steamId;
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`;
    const r = await fetch(url);
    const j = await r.json();
    const player = j?.response?.players?.[0] ?? null;
    return res.json({ steamId, player });
  } catch (err: any) {
    console.error("me error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

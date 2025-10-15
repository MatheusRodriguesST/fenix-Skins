// pages/api/bots/[steamId]/inventory.ts
import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

const APPID = 730;       // CS:GO / CS2
const CONTEXTID = 2;     // contexto da arma (pode variar: 2 é comum)
const STEAM_API_KEY = process.env.STEAM_API_KEY || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { steamId } = req.query;
  if (!steamId) return res.status(400).json({ error: "Missing steamId" });

  try {
    // Steam Community Inventory JSON endpoint (sem API key)
    const url = `https://steamcommunity.com/inventory/${steamId}/${APPID}/${CONTEXTID}?l=english&count=5000`;
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: "Steam inventory request failed" });
    const json = await r.json();

    // json.assets + json.descriptions
    const assets = json.assets ?? [];
    const descs = json.descriptions ?? [];

    // map descriptions by classid+instanceid
    const mapDesc = new Map<string, any>();
    for (const d of descs) {
      const key = `${d.classid}_${d.instanceid}`;
      mapDesc.set(key, d);
    }

    const items = assets.map((a: any) => {
      const key = `${a.classid}_${a.instanceid}`;
      const d = mapDesc.get(key) ?? {};
      // building image url: d.icon_url or d.icon_url_large via steamcdn
      const icon = d.icon_url_large || d.icon_url || null;
      const image = icon ? `https://steamcommunity-a.akamaihd.net/economy/image/${icon}` : null;
      return {
        id: `${a.assetid}`,
        name: d.market_name || d.name || "Item",
        market_hash_name: d.market_hash_name || null,
        image,
        tradable: a.tradable ?? true,
        classid: a.classid,
      };
    });

    res.json({ count: items.length, items });
  } catch (err: any) {
    console.error("inventory error:", err);
    res.status(500).json({ error: err.message ?? String(err) });
  }
}

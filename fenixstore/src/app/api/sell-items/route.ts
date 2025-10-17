// src/app/api/sell-items/route.ts
// New API route to create pending_sells

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
  }

  const { items } = await req.json();  // [{assetId, marketHashName, price}]
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: false, message: "No items provided" }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();
    const botSteamIds = JSON.parse(process.env.BOT_STEAM_IDS || "[]");  // Array of bot steamids, e.g. ["7656119..."]
    if (botSteamIds.length === 0) {
      return NextResponse.json({ ok: false, message: "No bots configured" }, { status: 500 });
    }

    const pendingInserts = items.map((item, idx) => ({
      user_id: user.id,
      bot_steam_id: botSteamIds[idx % botSteamIds.length],  // Round-robin bots
      asset_id: item.assetId,
      market_hash_name: item.marketHashName,
      price: item.price,
      status: 'pending',
    }));

    const { error } = await supabase.from("pending_sells").insert(pendingInserts);
    if (error) throw error;

    // Bots will pick up from here (in separate script)
    return NextResponse.json({ ok: true, message: "Pending sells created. Trade offers will be sent soon." });
  } catch (err) {
    console.error("sell-items error", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
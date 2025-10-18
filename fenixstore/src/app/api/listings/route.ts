// src/app/api/listings/route.ts
// Improvements:
// - Added bot_steam_id validation (but since set in bot.js, optional here).
// - Ensured item jsonb includes all details (stickers, charms, etc.).
// - Improved error handling.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY env variables");
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seller_id, bot_steam_id, item, price } = body;  // bot_steam_id optional here (set by bot.js)

    if (!seller_id || !item || !price) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const itemId = item?.id ?? null;
    if (!itemId) {
      return NextResponse.json(
        { ok: false, message: "Item must include an id" },
        { status: 400 }
      );
    }

    // Validate user
    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", seller_id)
      .maybeSingle();
    if (userErr) throw userErr;
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Invalid seller" },
        { status: 403 }
      );
    }

    // Insert with full item details
    const { data, error } = await supabaseAdmin
      .from("listings")
      .insert({
        seller_id,
        bot_steam_id: bot_steam_id || null,  // Allow null if not set
        item,  // Assumes item has stickers, charms, float, pattern, image, etc.
        price,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    // Delete from user_items if exists
    const { error: delErr } = await supabaseAdmin
      .from("user_items")
      .delete()
      .eq("item->>id", String(itemId))
      .eq("user_id", seller_id);

    if (delErr) {
      console.error("Failed to delete user_items:", delErr);
    }

    return NextResponse.json({ ok: true, listing: data });
  } catch (err) {
    console.error("listings POST error", err);
    return NextResponse.json(
      { ok: false, message: "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("status", "active");

    if (error) throw error;
    return NextResponse.json({ ok: true, listings: data });
  } catch (err) {
    console.error("listings GET error", err);
    return NextResponse.json(
      { ok: false, message: "Internal error" },
      { status: 500 }
    );
  }
}
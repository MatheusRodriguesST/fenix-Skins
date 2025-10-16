// src/app/api/listings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use server-side Supabase with service role for security
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Add this to .env
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seller_id, item, price } = body;

    if (!seller_id || !item || !price) {
      return NextResponse.json({ ok: false, message: "Missing required fields" }, { status: 400 });
    }

    // Validate user exists
    const { data: user } = await supabaseAdmin.from("users").select("id").eq("id", seller_id).single();
    if (!user) {
      return NextResponse.json({ ok: false, message: "Invalid seller" }, { status: 403 });
    }

    // Insert listing
    const { data, error } = await supabaseAdmin.from("listings").insert({
      seller_id,
      item, // jsonb
      price,
      status: "active",
      // bot_id: optional, add when trade implemented
    }).select().single();

    if (error) throw error;

    // Remove from user_items if exists
    await supabaseAdmin.from("user_items").delete().eq("user_id", seller_id).eq("item->>id", item.id); // Assuming item has id

    return NextResponse.json({ ok: true, listing: data });
  } catch (err) {
    console.error("listings POST error", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("listings").select("*").eq("status", "active");
    if (error) throw error;
    return NextResponse.json({ ok: true, listings: data });
  } catch (err) {
    console.error("listings GET error", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
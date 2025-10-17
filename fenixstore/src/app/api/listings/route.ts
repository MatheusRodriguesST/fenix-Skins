// src/app/api/listings/route.ts
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
    const { seller_id, item, price } = body;

    if (!seller_id || !item || !price) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // validação básica para item.id (garanta que exista)
    const itemId = item?.id ?? null;
    if (!itemId) {
      return NextResponse.json(
        { ok: false, message: "Item must include an id" },
        { status: 400 }
      );
    }

    // Validate user exists
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

    // Insert listing
    const { data, error } = await supabaseAdmin
      .from("listings")
      .insert({
        seller_id,
        item, // jsonb column
        price,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    // Remove from user_items if exists
    // Use .eq for JSONB field extraction
    const { error: delErr } = await supabaseAdmin
      .from("user_items")
      .delete()
      .eq("item->>id", String(itemId))
      .eq("user_id", seller_id);

    if (delErr) {
      // não falhamos a operação do listing por conta do delete falhar,
      // mas logamos o erro para investigação
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
      .eq("status", "active"); // <-- correção aqui

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
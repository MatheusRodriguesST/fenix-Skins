// app/api/user/create-sell-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: false, message: "Missing items" }, { status: 400 });
  }

  try {
    const orders = items.map((item) => {
      const suggested = item.suggested_price ?? 0;
      const user_price = item.user_price ?? suggested;
      const site_fee = 0.05;
      const net = user_price * (1 - site_fee);
      return {
        user_id: user.id,
        item_name: item.market_hash_name,
        item_assetid: item.id,
        suggested_price: suggested,
        user_price,
        site_fee,
        net_amount: net,
        status: "pending",
      };
    });

    const { error } = await supabaseAdmin.from("sell_orders").insert(orders);
    if (error) {
      console.error("create-sell-order DB error", error);
      return NextResponse.json({ ok: false, message: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: orders.length });
  } catch (err) {
    console.error("create-sell-order error", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}

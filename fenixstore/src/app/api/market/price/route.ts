// app/api/market/price/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const market_hash_name = searchParams.get("market_hash_name");
  if (!market_hash_name)
    return NextResponse.json({ ok: false, message: "Missing market_hash_name" }, { status: 400 });

  try {
    const res = await fetch(
      `https://steamcommunity.com/market/priceoverview/?currency=7&appid=730&market_hash_name=${encodeURIComponent(
        market_hash_name
      )}`
    );

    const json = await res.json();
    if (!json || !json.success) {
      return NextResponse.json({ ok: false, message: "Steam price lookup failed" }, { status: 400 });
    }

    const priceText = json.lowest_price || json.median_price || "R$ 0,00";
    const numeric = Number(priceText.replace(/[^\d,]/g, "").replace(",", "."));
    return NextResponse.json({ ok: true, price: numeric });
  } catch (err) {
    console.error("market/price error", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}

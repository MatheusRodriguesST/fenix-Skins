// app/api/market/price/route.ts
import { NextRequest, NextResponse } from "next/server";

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.ok || ![429, 503].includes(res.status)) return res;
    if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000)); // Backoff: 1s, 2s, 4s
  }
  throw new Error(`Fetch failed after ${retries} attempts`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const market_hash_name = searchParams.get("market_hash_name");
  if (!market_hash_name)
    return NextResponse.json({ ok: false, message: "Missing market_hash_name" }, { status: 400 });

  try {
    const res = await fetchWithRetry(
      `https://steamcommunity.com/market/priceoverview/?currency=7&appid=730&market_hash_name=${encodeURIComponent(
        market_hash_name
      )}`,
      { headers }
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
// src/app/api/bots/[steamId]/inventory/route.ts
import { NextResponse } from "next/server";

type PriceOverview = {
  success: boolean;
  lowest_price?: string;
  median_price?: string;
  volume?: string;
};

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.ok || ![429, 503].includes(res.status)) return res;
    if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000)); // Backoff: 1s, 2s, 4s
  }
  throw new Error(`Fetch failed after ${retries} attempts`);
}

export async function GET(req: Request, context: { params: Promise<{ steamId: string }> }) {  // *** CORRIGIDO: params como Promise
  const { steamId } = await context.params;  // *** CORRIGIDO: Await params

  // VERIFICAÇÃO MAIS ROBUSTA
  // O erro 400 na API da Steam sugere que o steamId está inválido (provavelmente a string "undefined")
  if (!steamId || steamId === "undefined" || !/^\d+$/.test(steamId)) {
    console.error("Invalid steamId received:", steamId);
    return NextResponse.json({ ok: false, message: "A valid steamId is required" }, { status: 400 });
  }

  const url = new URL(req.url);
  const appid = url.searchParams.get("appid") ?? "730";
  const contextid = url.searchParams.get("contextid") ?? "2";
  const maxItems = Number(url.searchParams.get("limit") ?? "50");
  const onlyTradable = url.searchParams.get("only_tradable") === "1";

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  try {
    // Fetch Steam inventory
    const invUrl = `https://steamcommunity.com/inventory/${steamId}/${appid}/${contextid}?l=english&count=1000`;
    const invRes = await fetchWithRetry(invUrl, { headers });

    if (invRes.status === 403) return NextResponse.json({ ok: false, message: "Inventory is private" }, { status: 403 });
    if (invRes.status === 404) return NextResponse.json({ ok: false, message: "Inventory not found" }, { status: 404 });
    if (!invRes.ok) {
      const errorText = await invRes.text();
      console.error(`Steam inventory fetch failed for ${steamId}: status ${invRes.status}, body: ${errorText}`);
      return NextResponse.json({ ok: false, message: `Failed to fetch inventory from Steam (status: ${invRes.status})` }, { status: 502 });
    }

    const invJson = await invRes.json();
    const assets = invJson.assets ?? [];
    const descriptions = invJson.descriptions ?? [];

    const descMap = new Map<string, any>();
    for (const d of descriptions) {
      const key = `${d.classid}_${d.instanceid ?? "0"}`;
      descMap.set(key, d);
    }

    const items: any[] = [];
    for (const a of assets) {
      const key = `${a.classid}_${a.instanceid ?? "0"}`;
      const desc = descMap.get(key);
      if (!desc) continue;
      
      const market_hash_name = desc.market_hash_name;
      if (!market_hash_name) continue;

      const id = a.assetid;
      const icon = desc.icon_url ? `https://steamcommunity-a.akamaihd.net/economy/image/${desc.icon_url}` : null;
      const tradable = Boolean(desc.tradable === 1 || desc.marketable === 1);

      // *** CORRIGIDO: Float e pattern do ASSET (a), não do desc
      const float = a.floatvalue ? parseFloat(a.floatvalue) : undefined;
      const pattern = a.paintseed ? parseInt(a.paintseed) : undefined;
      
      // *** Stickers e charms do DESC (se presentes)
      const stickers = desc.stickers ? desc.stickers.map((s: any) => ({ name: s.name || `Sticker ${s.sticker_item_id}`, wear: s.wear })) : [];
      const charms = desc.charms ? desc.charms.map((c: any) => ({ name: c.name || `Charm ${c.charm_id}`, wear: c.wear })) : [];

      items.push({ 
        id, 
        market_hash_name, 
        name: desc.name, 
        icon_url: icon, 
        tradable, 
        float, 
        pattern, 
        stickers: stickers.map((s: any) => s.name),  // Só nomes pros componentes
        charms: charms.map((c: any) => c.name),     // Só nomes pros componentes
      });
    }

    if (items.length === 0) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const itemsToPrice = (onlyTradable ? items.filter((i) => i.tradable) : items)
      .slice(0, maxItems);

    async function fetchPrice(market_hash_name: string): Promise<{ market_hash_name: string; lowest_price?: string; price_number?: number }> {
      const q = encodeURIComponent(market_hash_name);
      const priceUrl = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=${appid}&market_hash_name=${q}`;
      try {
        const res = await fetchWithRetry(priceUrl, { headers, next: { revalidate: 3600 } }); // Cache for 1 hour
        if (!res.ok) return { market_hash_name };
        const json: PriceOverview = await res.json();
        if (!json.success) return { market_hash_name };
        
        const lowest_price = json.lowest_price ?? json.median_price;
        let price_number: number | undefined = undefined;
        if (lowest_price) {
          const digits = lowest_price.replace(/[^\d.,-]/g, "").replace(",", ".");
          price_number = parseFloat(digits);
          if (Number.isNaN(price_number)) price_number = undefined;
        }
        return { market_hash_name, lowest_price, price_number };
      } catch (err) {
        console.error("Price fetch err for:", market_hash_name, err);
        return { market_hash_name };
      }
    }

    const pricePromises = itemsToPrice.map((it) => fetchPrice(it.market_hash_name));
    const priceResults = await Promise.all(pricePromises);
    
    const priceMap = new Map<string, any>();
    for (const r of priceResults) {
        if(r.lowest_price) priceMap.set(r.market_hash_name, r);
    }
    
    const responseItems = items.map((it) => {
      const p = priceMap.get(it.market_hash_name);
      const priceNum = p?.price_number;
      const recommended = typeof priceNum === "number" ? Number((priceNum * 0.95).toFixed(2)) : null;
      
      return {
        id: it.id,
        market_hash_name: it.market_hash_name,
        name: it.name,
        icon_url: it.icon_url,
        tradable: it.tradable,
        steam_price_display: p?.lowest_price ?? null,
        steam_price_number: priceNum ?? null,
        recommended_price: recommended,
        float: it.float,
        pattern: it.pattern,
        stickers: it.stickers,
        charms: it.charms,
      };
    });

    return NextResponse.json({ ok: true, items: responseItems });
  } catch (err) {
    console.error("Inventory GET error for", steamId, err);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}
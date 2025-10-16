// src/app/api/bots/[steamId]/inventory/route.ts
import { NextResponse } from "next/server";

const APPID = 730;
const CONTEXTS = ["2", "6"];
const STEAMCDN_PREFIX = "https://steamcommunity-a.akamaihd.net/economy/image/";
const DEFAULT_TIMEOUT_MS = 12000;

function log(...args: any[]) {
  console.log("[api:inventory]", ...args);
}

async function fetchWithTimeout(url: string, timeoutMs = DEFAULT_TIMEOUT_MS, init?: RequestInit) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, ...init });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

type TryResult =
  | { ok: true; json: any; status: number; snippet?: string }
  | { ok: false; status?: number; snippet?: string; error?: string };

async function tryFetchVariants(url: string): Promise<TryResult> {
  // We'll try a few variants of headers and query parameters to coax Steam into returning JSON.
  const tries: { name: string; init: RequestInit }[] = [];

  // Basic UA only
  tries.push({
    name: "ua-only",
    init: {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "*/*",
      },
      cache: "no-cache",
    },
  });

  // Add Referer pointing to steamcommunity profile
  tries.push({
    name: "ua-referer",
    init: {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "*/*",
        Referer: "https://steamcommunity.com/",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-cache",
    },
  });

  // Try more aggressive headers (some endpoints like a referer + origin help)
  tries.push({
    name: "ua-referer-origin",
    init: {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "*/*",
        Referer: "https://steamcommunity.com/",
        Origin: "https://steamcommunity.com",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-cache",
    },
  });

  // Smaller count param sometimes helps; handled by caller by building URL variations.
  for (const t of tries) {
    try {
      const res = await fetchWithTimeout(url, DEFAULT_TIMEOUT_MS, t.init);
      const status = res.status;
      const text = await res.text().catch(() => "");
      // log the try
      log(`attempt=${t.name} status=${status} len=${String(text).length}`);
      // Steam sometimes returns literal null, or HTML page (starts with '<')
      const snippet = text?.slice(0, 1000);

      // If response doesn't start with '{' treat as failure (HTML / null)
      if (!text || !text.trim().startsWith("{")) {
        // but if status 200 and text === 'null' it's still not usable
        return { ok: false, status, snippet, error: "non-json response" };
      }

      // try parse
      try {
        const parsed = JSON.parse(text);
        return { ok: true, json: parsed, status, snippet };
      } catch (e: unknown) {
        return { ok: false, status, snippet, error: "json-parse-failed" };
      }
    } catch (err: any) {
      const msg = (err && (err.message ?? String(err))) || String(err);
      log(`fetch variant ${t.name} error:`, msg);
      // continue to next variant
    }
  }

  return { ok: false, error: "all variants failed" };
}

export async function GET(_req: Request, context: any) {
  const start = Date.now();

  // --- robust steamId extraction ---
  let steamId: string | undefined;
  try {
    if (context?.params) {
      const maybeParams = typeof context.params.then === "function" ? await context.params : context.params;
      steamId = maybeParams?.steamId;
    }
  } catch (err: unknown) {
    log("warning awaiting context.params:", (err as any)?.message ?? String(err));
  }

  // fallback: parse request URL if still not found
  if (!steamId) {
    try {
      let urlObj: URL;
      try {
        urlObj = new URL(String(_req.url));
      } catch {
        urlObj = new URL(String(_req.url), "http://localhost:3000");
      }
      const parts = urlObj.pathname.split("/").filter(Boolean);
      const botsIndex = parts.indexOf("bots");
      if (botsIndex >= 0 && parts.length > botsIndex + 1) steamId = parts[botsIndex + 1];
    } catch (err: unknown) {
      log("warning parse URL fallback failed:", (err as any)?.message ?? String(err));
    }
  }

  if (!steamId) {
    log("missing steamId - returning 400");
    return NextResponse.json({ ok: false, message: "Missing steamId" }, { status: 400 });
  }

  log(`start steamId=${steamId}`);

  let finalJson: any = null;
  let finalStatus: number | undefined = undefined;
  let finalSnippet: string | undefined = undefined;

  // Try multiple contexts and also try with smaller count values if needed
  const countVariants = [5000, 1000, 200, 50];

  for (const contextId of CONTEXTS) {
    for (const count of countVariants) {
      const url = `https://steamcommunity.com/inventory/${steamId}/${APPID}/${contextId}?l=english&count=${count}`;
      log(`trying url context=${contextId} count=${count}`);
      const result = await tryFetchVariants(url);

      if (result.ok) {
        finalJson = result.json;
        finalStatus = result.status;
        finalSnippet = result.snippet;
        break;
      } else {
        finalStatus = result.status;
        finalSnippet = result.snippet ?? result.error;
        log(`try failed for context=${contextId} count=${count}: status=${result.status} error=${result.error}`);
        // if steam returned non-json but status 200 perhaps it's 'null' meaning private/empty; keep trying other counts
      }
    }

    if (finalJson) break;
  }

  // If we didn't get JSON from any variant, return debug info
  if (!finalJson) {
    log("all attempts failed. returning debug to caller", { status: finalStatus, snippet: finalSnippet });
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch inventory from Steam (tried multiple variants). See debug.snippet",
        debug: { status: finalStatus, snippet: finalSnippet },
      },
      { status: 502 }
    );
  }

  // Parse and normalize
  const json = finalJson;
  if (json?.success === false) {
    log("steam success:false -> private or blocked", json);
    return NextResponse.json({ ok: false, message: "Inventory is private or not available", debug: json }, { status: 403 });
  }

  const assets = json.assets ?? [];
  const descs = json.descriptions ?? [];

  if (!Array.isArray(assets) || assets.length === 0) {
    log("inventory empty or no assets");
    return NextResponse.json({ ok: true, steamId, count: 0, items: [], raw: { assets: assets.length ?? 0, descriptions: descs.length ?? 0 } });
  }

  const mapDesc = new Map<string, any>();
  for (const d of descs) {
    if (d?.classid !== undefined && d?.instanceid !== undefined) {
      mapDesc.set(`${d.classid}_${d.instanceid}`, d);
    }
  }

  const items = assets.map((a: any) => {
    const key = `${a.classid}_${a.instanceid}`;
    const d = mapDesc.get(key) ?? {};
    const icon = d.icon_url_large || d.icon_url || d.icon || null;
    const image = icon ? `${STEAMCDN_PREFIX}${icon}` : null;
    return {
      id: String(a.assetid ?? ""),
      assetid: a.assetid,
      classid: a.classid,
      instanceid: a.instanceid,
      contextid: a.contextid ?? CONTEXTS[0],
      name: d.market_hash_name || d.market_name || d.name || "Unknown Item",
      image,
      tradable: d?.tradable === 1 || a?.tradable === 1 || false,
      tags: d.tags || [], // Include for rarity/condition
      descriptions: d.descriptions || [], // For stickers
      // Add more if needed
    };
  });

  log(`success: returning ${items.length} items (took ${Date.now() - start}ms)`);
  return NextResponse.json({
    ok: true,
    steamId,
    count: items.length,
    items,
    raw: { assets: assets.length, descriptions: descs.length },
    tookMs: Date.now() - start,
  });
}

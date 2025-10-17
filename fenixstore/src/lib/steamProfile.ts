// src/lib/steamProfile.ts (replace fetchSteamProfile)
import { parseStringPromise } from "xml2js";

export interface SteamProfile {
  steamId64: string;
  personaName: string;
  avatarFull: string;
  realname?: string;
  profileUrl: string;
  privacyState: string;
}

function getValue(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) return v[0];
  return String(v);
}

function normalizePrivacy(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = String(raw).trim().toLowerCase();
  // common variants seen in Steam responses:
  if (["1","3"].includes(s)) return s;        // numeric variants
  if (s.includes("public")) return "public";
  if (s.includes("private")) return "private";
  if (s.includes("friends")) return "friends";
  return s;
}

export async function fetchSteamProfile(steamId: string): Promise<SteamProfile | null> {
  try {
    const xmlUrl = `https://steamcommunity.com/profiles/${steamId}/?xml=1`;
    const res = await fetch(xmlUrl, { headers: { "User-Agent": "node-fetch" } });
    if (!res.ok) {
      console.error("fetchSteamProfile: HTTP error", res.status, res.statusText);
      return null;
    }

    const text = await res.text();

    // parse XML
    const parsed = await parseStringPromise(text, { explicitArray: true, explicitRoot: false, trim: true });

    // inspect structure if it looks unexpected (helpful while debugging)
    const profile = parsed.profile ?? parsed;
    if (!profile) {
      console.error("fetchSteamProfile: perfil não encontrado no XML — parsed:", parsed);
      return null;
    }

    // extract fields (try multiple possible XML node names)
    const steamID64 = getValue(profile.steamID64) || getValue(profile.steamId) || steamId;
    const personaName = getValue(profile.personaName) || getValue(profile.steamID) || `steam:${steamId}`;

    // avatar fields vary: avatarFull, avatarFullFull, avatarMedium, avatar, avatarIcon, etc.
    const avatarFull =
      getValue(profile.avatarFullFull) ||
      getValue(profile.avatarFull) ||
      getValue(profile.avatarMedium) ||
      getValue(profile.avatar) ||
      getValue(profile.avatarIcon) ||
      "";

    const realname = getValue(profile.realname);
    const profileUrl = getValue(profile.profileUrl) || `https://steamcommunity.com/profiles/${steamId}`;

    // privacy — try multiple fields and normalize
    const rawPrivacy = getValue(profile.privacyState) ?? getValue(profile.privacy) ?? getValue(profile.communityVisibilityState);
    const privacyState = normalizePrivacy(rawPrivacy) ?? String(rawPrivacy ?? "").toLowerCase();

    // **Important change**: DO NOT abort login just because privacyState !== "1".
    // Let the caller (auth callback) decide whether to allow/reject or warn.
    // But still return the parsed profile.
    return {
      steamId64: steamID64 || steamId,
      personaName,
      avatarFull,
      realname: realname || undefined,
      profileUrl,
      privacyState: privacyState || "",
    };
  } catch (err) {
    console.error("fetchSteamProfile error:", err);
    return null;
  }
}

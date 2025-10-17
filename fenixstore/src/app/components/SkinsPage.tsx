// src/pages/SkinsPage.tsx (or app/skins/page.tsx)
// Main changes in loadUserItems: Always fetch both DB and Steam, merge them.
// Added steam_id to User interface.
// Improved possibleSteamId to prefer user.steam_id if valid, else fallback to user.id (for route to handle).
// Added more logging for debugging.
// In setUserItems, concatenate DB and Steam items (no duplicates assumed, as DB are purchased/pending, Steam are current).

"use client";

import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ItemGrid from "../components/ItemGrid";
import Pagination from "../components/Pagination";
import QuickViewModal from "../components/QuickViewModal";
import TradeUrlModal from "../components/TradeUrlModal";
import AuctionModal from "../components/AuctionModal";
import CartSidebar from "../components/CartSidebar";
import SellModal from "../components/SellModal";
import Notifications from "../components/NotificationToast";
import SkeletonCard from "../components/SkeletonCard";
import Footer from "../components/Footer";

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found.");
  throw new Error("Supabase environment variables missing.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface User {
  id: string;
  display_name?: string;
  trade_url?: string;
  balance?: number;
  avatar?: string;
  steam_id?: string; // Adicionado para compatibilidade com steam_id do usuário
}

interface ListingItem {
  id: string;
  displayName: string;
  weapon: string;
  skin: string;
  condition: string;
  image?: string | null;
  price: number;
  tradable: boolean;
  rarity: string;
  stickers?: string[];
  charms?: string[];
  float?: number;
  pattern?: number;
  sellerId: string; // Added for payout
}

interface AuctionItem extends ListingItem {
  auctionId: string;
  currentBid: number;
  endTime: Date;
  bidderId: string | null;
  minBid: number;
  sellerId: string;
  status: string;
  dbId?: string;
}

interface CartLine { item: ListingItem; qty: number }

interface Notification {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

function calcPayout(price: number) {
  return Number((price * 0.95).toFixed(2));
}

function parseFullName(full: string | undefined) {
  if (!full) return { weapon: "Unknown", skin: "Unknown", condition: "Unknown" };
  const parts = full.split(" | ");
  const weapon = parts[0] || "Unknown";
  let skin = parts[1] || "Unknown";
  let condition = parts[2] || "Unknown";

  // Extrai condition de ( ) no final do skin name
  const conditionMatch = skin.match(/^(.*?) \(([^)]+)\)$/);
  if (conditionMatch) {
    skin = conditionMatch[1].trim();
    condition = conditionMatch[2].trim();
  }

  return { weapon, skin, condition };
}

function categorizeWeapon(weapon: string) {
  const map: { [key: string]: string } = {
    "AK-47": "Rifles",
    "M4A4": "Rifles",
    "M4A1-S": "Rifles",
    "AWP": "Sniper Rifles",
    "Glock-18": "Pistols",
    // Add more as needed
  };
  return map[weapon] || "Other";
}

function suggestPriceFromName(name: string) {
  // Simple mock; in real, use Steam API or DB
  return Math.random() * 100 + 10;
}

function determineRarity(name: string) {
  const rarities = ["Consumer Grade", "Industrial Grade", "Mil-Spec", "Restricted", "Classified", "Covert", "Contraband"];
  return rarities[Math.floor(Math.random() * rarities.length)];
}

function getRarityColor(rarity: string) {
  const colors: { [key: string]: string } = {
    "Consumer Grade": "bg-gray-500",
    "Industrial Grade": "bg-blue-500",
    "Mil-Spec": "bg-blue-600",
    "Restricted": "bg-purple-500",
    "Classified": "bg-red-500",
    "Covert": "bg-gold-500",
    "Contraband": "bg-orange-500",
  };
  return colors[rarity] || "bg-gray-500";
}

function getRarityGlow(rarity: string) {
  return rarity === "Covert" ? "shadow-yellow-500/50" : "shadow-transparent";
}

function getConditionColor(condition: string) {
  const colors: { [key: string]: string } = {
    "Factory New": "text-green-400",
    "Minimal Wear": "text-green-300",
    "Field-Tested": "text-yellow-400",
    "Well-Worn": "text-orange-400",
    "Battle-Scarred": "text-red-400",
  };
  return colors[condition] || "text-gray-400";
}

export default function SkinsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedItemToSell, setSelectedItemToSell] = useState<ListingItem | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [items, setItems] = useState<ListingItem[]>([]);
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
  const [userItems, setUserItems] = useState<(ListingItem & { dbId: string })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"market" | "auction" | "inventory">("market");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [sortBy, setSortBy] = useState<string>("priceHigh");
  const [quickViewItem, setQuickViewItem] = useState<ListingItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [onlyTradable, setOnlyTradable] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeUrlInput, setTradeUrlInput] = useState("");
  const [savingTradeUrl, setSavingTradeUrl] = useState(false);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextNotifId, setNextNotifId] = useState(0);
  const [bidInputs, setBidInputs] = useState<{ [id: string]: number }>({});
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [selectedItemForAuction, setSelectedItemForAuction] = useState<(ListingItem & { dbId: string }) | null>(null);
  const [minBid, setMinBid] = useState<number>(0);
  const [auctionTime, setAuctionTime] = useState<number>(24);
  const [sellMode, setSellMode] = useState(false);
  const pageSize = 12;

  // Função helper pra cache local (10 min)
  const getLocalCache = (key: string) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > 10 * 60 * 1000) {  // 10 min
      localStorage.removeItem(key);
      return null;
    }
    return data;
  };

  const setLocalCache = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  };

  function addNotification(message: string, type: "success" | "error" | "info" = "info") {
    const id = nextNotifId;
    setNextNotifId(id + 1);
    setNotifications([...notifications, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  }

  function removeNotification(id: number) {
    setNotifications(notifications.filter((n) => n.id !== id));
  }

  useEffect(() => {
    async function fetchMe() {
      setLoadingUser(true);
      try {
        const res = await fetch("/api/user/me", { credentials: "include" });
        if (!res.ok) {
          setUser(null);
          setLoadingUser(false);
          return;
        }
        const json = await res.json();
  
        // compatibilidade com { ok: true, user } e com { user }
        const userData = json?.user ?? (json?.ok ? json?.data ?? null : null);
  
        if (userData) {
          setUser(userData);
          if (userData && !userData.trade_url) {
            setShowTradeModal(true);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("fetchMe error:", err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }
  
    fetchMe();
  
    const timer = setTimeout(() => {
      if (!user) fetchMe();
    }, 1000);
  
    return () => clearTimeout(timer);
  }, []);
  

  async function saveTradeUrl() {
    if (!user) return;
    setSavingTradeUrl(true);
    setTradeMessage(null);
    try {
      const res = await fetch("/api/user/trade-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ trade_url: tradeUrlInput }),
      });
      const j = await res.json();
      if (!j.ok) {
        setTradeMessage("Erro: " + (j.message || "unknown"));
        addNotification("Erro ao salvar Trade URL", "error");
      } else {
        setTradeMessage("Trade URL salvo com sucesso!");
        setUser({ ...user, trade_url: tradeUrlInput });
        addNotification("Trade URL salvo com sucesso!", "success");
        setTimeout(() => setShowTradeModal(false), 1500);
      }
    } catch (err) {
      console.error(err);
      setTradeMessage("Erro ao salvar trade URL.");
      addNotification("Erro ao salvar Trade URL", "error");
    } finally {
      setSavingTradeUrl(false);
    }
  }

  useEffect(() => {
    async function loadListings() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/listings");
        if (!res.ok) throw new Error("Failed to load listings");
        const json = await res.json();
        if (json.ok && json.listings) {
          setItems(json.listings.map((l: any) => ({
            ...l.item,
            price: l.price,
            sellerId: l.seller_id,
            // Assume l.item has float, pattern, stickers, charms
          })));
        } else {
          setItems([]);
          setError("No listings found");
        }
      } catch (err) {
        console.error("loadListings error", err);
        setError("Erro ao carregar listings.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (viewMode === "market") {
      loadListings();
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === "auction" && user) {
      loadAuctions();
    }
  }, [viewMode, user]);

  useEffect(() => {
    if (viewMode === "inventory" && user) {
      loadUserItems();
    }
  }, [viewMode, user?.id, user?.steam_id]); // Alterado para user?.steam_id (para reagir se mudar)

  async function loadAuctions() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("auctions")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      setAuctionItems(data || []);
    } catch (err) {
      console.error("loadAuctions error", err);
      setError("Erro ao carregar leilões.");
      setAuctionItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function processEndedAuction(auction: any) {
    if (auction.status !== "ended") return;
    const { data: seller } = await supabase.from("users").select("balance").eq("id", auction.sellerId).single();
    if (seller) {
      const payout = auction.currentBid * 0.95;
      await supabase.from("users").update({ balance: seller.balance + payout }).eq("id", auction.sellerId);
    }
    await supabase.from("auctions").update({ status: "completed" }).eq("id", auction.id);
  }

  // Carrega inventário do usuário usando sua rota /api/bots/[steamId]/inventory
  async function loadUserItems() {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      console.debug("[loadUserItems] user:", user);

      // 1) Carrega itens COMPRADOS do DB (user_items) - sempre
      const resDb = await fetch(`/api/user/${user.id}/items`, { credentials: "include" });
      const jsonDb = await resDb.text().then((t) => {
        try { return JSON.parse(t); } catch (e) { return { ok: false, raw: t }; }
      });

      console.debug("[loadUserItems] /api/user/:", resDb.status, jsonDb);

      let dbItems: (ListingItem & { dbId?: string })[] = [];
      if (resDb.ok && jsonDb.ok && Array.isArray(jsonDb.items) && jsonDb.items.length > 0) {
        dbItems = jsonDb.items.map((it: any) => ({
          id: String(it.item?.id ?? it.id),
          displayName: it.item?.displayName ?? it.name ?? it.item?.market_hash_name ?? "Unknown",
          weapon: it.item?.weapon ?? "Unknown",
          skin: it.item?.skin ?? it.item?.market_hash_name ?? it.item?.name ?? "Unknown",
          condition: it.item?.condition ?? "Unknown",
          image: it.item?.image ?? it.icon_url ?? null,
          price: it.item?.recommended_price ?? it.price ?? 0,
          tradable: Boolean(it.item?.tradable ?? it.tradable ?? true),
          rarity: determineRarity(it.item?.displayName ?? it.name ?? ""),
          sellerId: user.id,
          dbId: it.id,
        })) as (ListingItem & { dbId?: string })[];

        console.debug("[loadUserItems] mapped from DB (comprados):", dbItems.length);
      }

      // 2) Fetch itens da Steam (sempre, para mostrar ambos DB + Steam)
      let steamItems: any[] = [];
      const cacheKey = `steam_inventory_${user.id}`;
      let cached = getLocalCache(cacheKey);
      if (cached) {
        steamItems = cached;
        console.debug("[loadUserItems] using cached Steam items:", steamItems.length);
      } else {
        let possibleSteamId: string | null = null;
        if (user.steam_id && /^\d{17}$/.test(user.steam_id)) {
          possibleSteamId = user.steam_id;
          console.debug("[loadUserItems] using valid user.steam_id:", possibleSteamId);
        } else {
          possibleSteamId = user.id; // Fallback para user.id (UUID), rota vai pegar user.steam_id do DB
          console.debug("[loadUserItems] fallback to user.id (UUID):", possibleSteamId, " - rota deve lidar");
        }

        if (possibleSteamId) {
          const res = await fetch(`/api/bots/${possibleSteamId}/inventory?limit=500&only_tradable=1`);
          if (!res.ok) {
            const txt = await res.text();
            console.warn(`[loadUserItems] /api/bots/${possibleSteamId}/inventory failed:`, res.status, txt);
            addNotification("Falha ao carregar itens da Steam. Mostrando apenas itens comprados.", "info");
          } else {
            const json = await res.json();
            console.debug("[loadUserItems] bot inventory response:", json?.items?.length ?? null);
            if (json.ok && Array.isArray(json.items) && json.items.length > 0) {
              steamItems = json.items;
              setLocalCache(cacheKey, steamItems);  // Cache local por 10 min
            }
          }
        } else {
          console.warn("[loadUserItems] no possibleSteamId available, skipping Steam fetch");
        }
      }

      const steamMapped: (ListingItem & { dbId?: string })[] = steamItems.map((it: any) => {
        const fullName = it.name ?? it.market_hash_name ?? "Unknown";
        const parsed = parseFullName(fullName);
        return {
          id: String(it.id),
          displayName: fullName,
          weapon: parsed.weapon,
          skin: parsed.skin,
          condition: parsed.condition,
          image: it.icon_url ?? null,
          price: it.recommended_price ?? it.steam_price_number ?? suggestPriceFromName(fullName),
          tradable: Boolean(it.tradable),
          rarity: determineRarity(fullName),
          sellerId: user.id,
          dbId: undefined,
          float: it.float ?? undefined,
          pattern: it.pattern ?? undefined,
          stickers: it.stickers ?? [],
          charms: it.charms ?? [],
        };
      });

      // 3) Merge: DB (comprados) + Steam (principalmente estes)
      const mergedItems = [...dbItems, ...steamMapped];
      console.debug("[loadUserItems] merged items (DB + Steam):", mergedItems.length);
      setUserItems(mergedItems);
    } catch (err) {
      console.error("loadUserItems error", err);
      setError("Falha ao carregar inventário do usuário.");
      setUserItems([]);
    } finally {
      setLoading(false);
    }
  }


// Cria uma listing a partir do item selecionado no inventário
async function createListingFromUserItem(item: ListingItem, price: number) {
  if (!user) {
    addNotification("Faça login para listar itens.", "error");
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const payload = {
      seller_id: user.id,
      item,
      price,
    };
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) {
      console.error("create listing failed", j);
      addNotification("Erro ao criar anúncio.", "error");
      return { ok: false, message: j?.message ?? "Erro" };
    }

    // remover item do inventário local (já foi movido para listings no backend)
    setUserItems((prev) => prev.filter((ui) => ui.id !== item.id));
    addNotification("Item listado com sucesso!", "success");
    setSellMode(false);
    setSelectedItemToSell(null);
    return { ok: true, listing: j.listing };
  } catch (err) {
    console.error("createListingFromUserItem error", err);
    addNotification("Erro ao criar anúncio.", "error");
    return { ok: false, message: "Internal error" };
  }
}


  async function createAuction() {
    if (!selectedItemForAuction || !user) return;
    try {
      const { data, error } = await supabase
        .from("auctions")
        .insert({
          item: selectedItemForAuction,
          seller_id: user.id,
          min_bid: minBid,
          current_bid: minBid,
          end_time: new Date(Date.now() + auctionTime * 60 * 60 * 1000),
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      setUserItems((prev) => prev.filter((ui) => ui.id !== selectedItemForAuction.id));
      addNotification("Leilão criado com sucesso!", "success");
      setShowAuctionModal(false);
      loadAuctions();
    } catch (err) {
      console.error("createAuction error", err);
      addNotification("Erro ao criar leilão.", "error");
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>(["Todas"]);
    const listSource = viewMode === "inventory" ? userItems : items;
    for (const it of listSource) set.add(categorizeWeapon(it.weapon));
    return Array.from(set);
  }, [items, userItems, viewMode]);
  
  const conditions = useMemo(() => {
    const s = new Set<string>();
    const listSource = viewMode === "inventory" ? userItems : items;
    for (const it of listSource) s.add(it.condition || "Unknown");
    return Array.from(s);
  }, [items, userItems, viewMode]);
  

  const filtered = useMemo(() => {
    let list: any[] = [];
    if (viewMode === "market") list = items;
    else if (viewMode === "auction") list = auctionItems;
    else if (viewMode === "inventory") list = userItems;

    const q = query.trim().toLowerCase();
    let out = list.filter((it: any) => {
      const matchesQ = q === "" || `${it.weapon} ${it.skin} ${it.displayName}`.toLowerCase().includes(q);
      const matchesCat = category === "Todas" || categorizeWeapon(it.weapon) === category;
      const matchesCond = conditionFilter.length === 0 || conditionFilter.includes(it.condition);
      const matchesTrad = !onlyTradable || it.tradable;
      const matchesPrice = (priceMin === "" || it.price >= Number(priceMin)) && (priceMax === "" || it.price <= Number(priceMax));
      return matchesQ && matchesCat && matchesCond && matchesTrad && matchesPrice;
    });

    if (sortBy === "priceLow") out = out.sort((a, b) => a.price - b.price);
    else if (sortBy === "priceHigh") out = out.sort((a, b) => b.price - a.price);
    else if (sortBy === "recent") out = out.sort((a, b) => (a.id > b.id ? -1 : 1));
    return out;
  }, [items, auctionItems, userItems, viewMode, query, category, sortBy, conditionFilter, onlyTradable, priceMin, priceMax]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleFavorite(id: string) {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
    addNotification("Favorito atualizado!", "success");
  }

  function addToCart(item: ListingItem) {
    setCart((prev) => {
      const found = prev.find((l) => l.item.id === item.id);
      if (found) return prev.map((l) => l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { item, qty: 1 }];
    });
    setCartOpen(true);
    addNotification(`${item.skin} adicionado ao carrinho!`, "success");
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((l) => l.item.id !== id));
    addNotification("Item removido do carrinho.", "info");
  }

  function updateQty(id: string, qty: number) {
    setCart((prev) => prev.map((l) => l.item.id === id ? { ...l, qty: Math.max(1, qty) } : l));
  }

  const cartTotal = useMemo(() => cart.reduce((s, l) => s + l.qty * l.item.price, 0), [cart]);

  async function confirmCheckout() {
    if (!user) {
      setError("Você precisa estar logado para finalizar a compra.");
      addNotification("Você precisa estar logado para comprar.", "error");
      return;
    }
    if ((user.balance ?? 0) < cartTotal) {
      setError("Saldo insuficiente. Faça um depósito ou remova itens do carrinho.");
      addNotification("Saldo insuficiente.", "error");
      return;
    }

    const newBalance = Number(((user.balance ?? 0) - cartTotal).toFixed(2));
    setUser({ ...user, balance: newBalance });
    await supabase.from("users").update({ balance: newBalance }).eq("id", user.id);

    for (const line of cart) {
      const payout = calcPayout(line.qty * line.item.price);
      // Payout to seller
      const { data: seller } = await supabase.from("users").select("balance").eq("id", line.item.sellerId).single();
      if (seller) {
        await supabase.from("users").update({ balance: seller.balance + payout }).eq("id", line.item.sellerId);
      }
      // Update listing status or remove
      await supabase.from("listings").update({ status: "sold" }).eq("item->>id", line.item.id);

      // *** NOVO: Insere os itens COMPRADOS no user_items do buyer (pra trade futura)
      for (let i = 0; i < line.qty; i++) {
        await supabase.from("user_items").insert({ 
          user_id: user.id, 
          item: line.item,
          created_at: new Date().toISOString()
        });
      }
    }

    // Limpa cache local do buyer (pra refetch itens comprados)
    localStorage.removeItem(`steam_inventory_${user.id}`);

    setItems((prev) => prev.filter((it) => !cart.some((c) => c.item.id === it.id)));
    setCart([]);
    setCartOpen(false);
    addNotification("Compra finalizada com sucesso! Itens adicionados ao seu inventário para trade.", "success");
    loadUserItems();  // Refetch pra mostrar os novos comprados
  }

  async function placeBid(item: AuctionItem) {
    const bid = bidInputs[item.auctionId] || item.minBid;
    if (bid <= item.currentBid) {
      addNotification("Lance deve ser maior que o atual.", "error");
      return;
    }
    try {
      await supabase
        .from("auctions")
        .update({ current_bid: bid, bidder_id: user?.id })
        .eq("id", item.auctionId);
      addNotification("Lance colocado com sucesso!", "success");
      loadAuctions();
    } catch (err) {
      console.error("placeBid error", err);
      addNotification("Erro ao colocar lance.", "error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-yellow-900 to-neutral-900 text-gray-100 antialiased font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,211,77,0.1),transparent_70%)] pointer-events-none" />
      {/* Background SVG omitted */}

      <Header
        query={query}
        setQuery={setQuery}
        cartLength={cart.reduce((s, l) => s + l.qty, 0)}
        setCartOpen={setCartOpen}
        loadingUser={loadingUser}
        user={user}
        setShowTradeModal={setShowTradeModal}
        setViewMode={setViewMode}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 py-8 pb-16">
        <Sidebar
          viewMode={viewMode}
          setViewMode={setViewMode}
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          categories={categories}
          conditionFilter={conditionFilter}
          setConditionFilter={setConditionFilter}
          conditions={conditions}
          priceMin={priceMin}
          setPriceMin={setPriceMin}
          priceMax={priceMax}
          setPriceMax={setPriceMax}
          onlyTradable={onlyTradable}
          setOnlyTradable={setOnlyTradable}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        <section className="lg:col-span-9">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">{viewMode === "market" ? "Mercado" : viewMode === "auction" ? "Leilões" : "Inventário"}</h2>
              <p className="text-sm text-gray-300 mt-1">{filtered.length} itens encontrados • Página {page} de {pageCount}</p>
            </div>
            {viewMode === "inventory" && user && (
              <motion.button
                onClick={() => setSellMode(true)}
                className="px-4 py-2 bg-green-600 rounded-full font-semibold text-white shadow hover:brightness-105"
                whileHover={{ scale: 1.05 }}
              >
                Vender Skins
              </motion.button>
            )}
          </div>

          {loading || loadingUser ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">{Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : error ? (
            <div className="p-8 bg-red-900/20 rounded-3xl text-red-300 text-center shadow-md">{error}</div>
          ) : viewMode === "inventory" && !user ? (
            <div className="p-8 bg-neutral-900/20 rounded-3xl text-gray-300 text-center shadow-md">Faça login com Steam para ver seu inventário.</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 bg-neutral-900/20 rounded-3xl text-gray-300 text-center shadow-md">Nenhum item encontrado com esses filtros.</div>
          ) : (
            <>
              <ItemGrid
                  viewMode={viewMode}
                  pageItems={pageItems}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  setQuickViewItem={setQuickViewItem}
                  addToCart={addToCart}
                  bidInputs={bidInputs}
                  setBidInputs={setBidInputs}
                  placeBid={placeBid}
                  setSelectedItemForAuction={setSelectedItemForAuction}
                  setShowAuctionModal={setShowAuctionModal}
                  setSelectedItemToSell={setSelectedItemToSell}   // <-- NOVO: permite ItemGrid abrir Sell flow por item
                  getRarityColor={getRarityColor}
                  getRarityGlow={getRarityGlow}
                  getConditionColor={getConditionColor}
                  calcPayout={calcPayout}
                  user={user}
                  setError={setError}
                />

              <Pagination
                filteredLength={filtered.length}
                page={page}
                pageCount={pageCount}
                setPage={setPage}
                pageSize={pageSize}
              />
            </>
          )}
        </section>
      </main>

      <QuickViewModal
        quickViewItem={quickViewItem}
        setQuickViewItem={() => setQuickViewItem(null)}
        addToCart={addToCart}
        setCartOpen={setCartOpen}
        user={user}
        setError={setError}
        getRarityColor={getRarityColor}
        calcPayout={calcPayout}
      />

      <TradeUrlModal
        showTradeModal={showTradeModal}
        setShowTradeModal={setShowTradeModal}
        tradeUrlInput={tradeUrlInput}
        setTradeUrlInput={setTradeUrlInput}
        savingTradeUrl={savingTradeUrl}
        tradeMessage={tradeMessage}
        saveTradeUrl={saveTradeUrl}
      />

      <AuctionModal
        showAuctionModal={showAuctionModal}
        setShowAuctionModal={setShowAuctionModal}
        minBid={minBid}
        setMinBid={setMinBid}
        auctionTime={auctionTime}
        setAuctionTime={setAuctionTime}
        createAuction={createAuction}
      />

      <CartSidebar
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        cart={cart}
        updateQty={updateQty}
        removeFromCart={removeFromCart}
        cartTotal={cartTotal}
        confirmCheckout={confirmCheckout}
        setCart={setCart}
      />

{sellMode && (
  <SellModal
    user={user}
    isOpen={sellMode}
    onClose={() => { setSellMode(false); setSelectedItemToSell(null); }}
    addNotification={addNotification}
    setUser={setUser}
    loadUserItems={loadUserItems}
    selectedItem={selectedItemToSell}  // Can be removed if not using single select
    createListing={createListingFromUserItem}  // Remove, as now using multi-sell
    userItems={userItems}  // NEW: pass for grid
  />
)}


      <Notifications notifications={notifications} removeNotification={removeNotification} />

      <Footer />
    </div>
  );
}
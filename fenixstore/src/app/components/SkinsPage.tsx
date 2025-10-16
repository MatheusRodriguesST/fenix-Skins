
// src/pages/SkinsPage.tsx (or app/skins/page.tsx)
"use client";

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
  // ... (keep as is)
}

function categorizeWeapon(weapon: string) {
  // ... (keep as is)
}

function suggestPriceFromName(name: string) {
  // ... (keep as is)
}

function determineRarity(name: string) {
  // ... (keep as is)
}

function getRarityColor(rarity: string) {
  // ... (keep as is)
}

function getRarityGlow(rarity: string) {
  // ... (keep as is)
}

function getConditionColor(condition: string) {
  // ... (keep as is)
}

export default function SkinsPage() {
  const [user, setUser] = useState<User | null>(null);
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
        if (json.ok) {
          setUser(json.user);
          if (json.user && !json.user.trade_url) {
            setShowTradeModal(true);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("fetchMe error:", err);
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
  }, [viewMode, user]);

  async function loadAuctions() {
    // ... (keep as is, but update AuctionItem to include new fields if needed)
  }

  async function processEndedAuction(auction: any) {
    // ... (keep as is, but payout to sellerId)
  }

  async function loadUserItems() {
    // ... (keep as is, update userItems to include new fields)
  }

  async function createAuction() {
    // ... (keep as is)
  }

  const categories = useMemo(() => {
    const set = new Set<string>(["Todas"]);
    for (const it of items) set.add(categorizeWeapon(it.weapon));
    return Array.from(set);
  }, [items]);

  const conditions = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) s.add(it.condition || "Unknown");
    return Array.from(s);
  }, [items]);

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

      for (let i = 0; i < line.qty; i++) {
        await supabase.from("user_items").insert({ user_id: user.id, item: line.item });
      }
    }

    setItems((prev) => prev.filter((it) => !cart.some((c) => c.item.id === it.id)));
    setCart([]);
    setCartOpen(false);
    addNotification("Compra finalizada com sucesso!", "success");
    loadUserItems();
  }

  async function placeBid(item: AuctionItem) {
    // ... (keep as is)
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
          onClose={() => setSellMode(false)}
          addNotification={addNotification}
          setUser={setUser}
          loadUserItems={loadUserItems}
        />
      )}

      <Notifications notifications={notifications} removeNotification={removeNotification} />

      <Footer />
    </div>
  );
}
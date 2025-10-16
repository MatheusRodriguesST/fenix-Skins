"use client";

import React, { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  display_name?: string;
  avatar?: string | null;
  trade_url?: string | null;
  balance?: number | null;
};

type Bot = {
  id: string;
  name?: string;
};

type Item = {
  id: string; // unique per item instance
  appid?: number;
  market_hash_name: string;
  icon_url?: string | null;
  tradable?: boolean;
  float?: number | null;
  price?: number | null; // steam price (fetched from server)
};

export default function ProfileAndSellComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [items, setItems] = useState<Item[]>([]); // aggregated inventory from all bots
  const [loading, setLoading] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellMode, setSellMode] = useState(false); // opens "new page" (modal-like)

  // SELL MODAL STATE
  const [userInventory, setUserInventory] = useState<Item[] | null>(null);
  const [inventoryPrivate, setInventoryPrivate] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [sellMessage, setSellMessage] = useState<string | null>(null);
  const [processingSell, setProcessingSell] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  // utility: try to resolve different kinds of icon_url Steam returns
  function resolveImageUrl(icon?: string | null, fallbackSize = 200) {
    const placeholder = `https://via.placeholder.com/${fallbackSize}?text=Sem+imagem`;
    if (!icon) return placeholder;
    try {
      if (icon.startsWith("http")) return icon;
      if (icon.startsWith("//")) return "https:" + icon;
      // many steam responses give a partial path like "/economy/image/abc..."
      if (icon.startsWith("/")) return `https://steamcommunity-a.akamaihd.net${icon}`;
      // fallback pattern used by many steam endpoints
      return `https://steamcommunity-a.akamaihd.net/economy/image/${icon}/${fallbackSize}x${fallbackSize}`;
    } catch (e) {
      return placeholder;
    }
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      // fetch user
      const resUser = await fetch("/api/user/me", { credentials: "same-origin" });
      const jUser = await resUser.json().catch(() => ({}));
      if (resUser.ok && jUser?.ok) {
        setUser(jUser.user);
      } else {
        setUser(null);
      }

      // fetch bots list
      const res = await fetch("/api/bots", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Falha ao carregar bots");
      const jb = await res.json();
      const botsList: Bot[] = Array.isArray(jb) ? jb : jb?.bots ?? [];
      const filtered = botsList.filter((b) => b.id !== "botfenix1" && (b.name ?? "").toLowerCase().indexOf("botfenix1") === -1);
      setBots(filtered);

      // aggregate inventory for all bots (parallel)
      setLoadingInventory(true);
      const invs: Item[] = [];
      await Promise.all(
        filtered.map(async (bot) => {
          try {
            const r = await fetch(`/api/bots/${bot.id}/inventory`, { credentials: "same-origin" });
            if (!r.ok) return;
            const j = await r.json().catch(() => null);
            const botItems: Item[] = j?.items ?? j ?? [];
            botItems.forEach((it) => {
              invs.push({
                id: `${bot.id}_${it.id ?? it.assetid ?? Math.random()}`,
                appid: it.appid,
                market_hash_name: it.market_hash_name ?? it.name ?? "unknown",
                icon_url: it.icon_url ?? it.icon_url_large ?? null,
                tradable: it.tradable ?? true,
                float: it.float ?? null,
                price: it.price ?? null,
              });
            });
          } catch (err) {
            console.warn("erro inventory bot", bot.id, err);
          }
        })
      );

      setItems(invs);
      setLoadingInventory(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro desconhecido");
      setLoadingInventory(false);
    } finally {
      setLoading(false);
    }
  }

  // open sell page (new page behavior: we toggle state and push history)
  async function openSellPage() {
    setSellMessage(null);
    setUserInventory(null);
    setCheckedIds({});
    setItemPrices({});
    setInventoryPrivate(false);

    if (!user?.trade_url) {
      setSellMessage("Você precisa cadastrar sua Trade URL nas configurações antes de vender.");
      setSellMode(true);
      return;
    }

    setSellMode(true);
    try {
      setSellMessage("Checando inventário com a Trade URL...");
      const r = await fetch(`/api/user/steam-inventory`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trade_url: user.trade_url }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (j?.message?.toLowerCase().includes("private")) {
          setInventoryPrivate(true);
          setSellMessage("Seu inventário está privado. Abra as configurações do Steam para torná-lo público e tente novamente.");
          return;
        }
        setSellMessage(j?.message || "Erro ao checar inventário");
        return;
      }

      const inv: Item[] = j?.items ?? [];
      if (!inv || inv.length === 0) {
        setSellMessage("Nenhuma skin encontrada no inventário público.");
        setUserInventory([]);
        return;
      }

      setSellMessage("Buscando preços de mercado para sugestões...");
      const withPrices = await Promise.all(
        inv.map(async (it: Item) => {
          try {
            const pr = await fetch(`/api/market/price?market_hash_name=${encodeURIComponent(it.market_hash_name)}`, { credentials: "same-origin" });
            if (!pr.ok) return { ...it, price: null } as Item;
            const jp = await pr.json().catch(() => null);
            return { ...it, price: jp?.price ?? null } as Item;
          } catch (e) {
            return { ...it, price: null } as Item;
          }
        })
      );

      // Normalize icon_url with our resolver: keep original in object but ensure we can display
      const normalized = withPrices.map((i) => ({ ...i, icon_url: i.icon_url ?? null }));

      setUserInventory(normalized);
      setSellMessage(null);
    } catch (err) {
      console.error(err);
      setSellMessage("Erro ao ler inventário do usuário.");
    }
  }

  function toggleCheck(id: string) {
    setCheckedIds((s) => ({ ...s, [id]: !s[id] }));
  }

  function setCustomPrice(id: string, value: number) {
    setItemPrices((p) => ({ ...p, [id]: value }));
  }

  const selectedItems = useMemo(() => {
    if (!userInventory) return [] as Item[];
    return userInventory.filter((it) => checkedIds[it.id]);
  }, [checkedIds, userInventory]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let recommended = 0;
    selectedItems.forEach((it) => {
      const rec = (it.price ?? 0) * 0.9;
      const base = (itemPrices[it.id] ?? rec);
      subtotal += base;
      recommended += rec;
    });
    const payout = subtotal * 0.95; // apply 5% site fee
    return { subtotal, payout, recommended };
  }, [selectedItems, itemPrices]);

  async function submitSell() {
    if (!selectedItems.length) {
      setSellMessage("Selecione pelo menos 1 item para vender.");
      return;
    }
    setProcessingSell(true);
    setSellMessage(null);
    try {
      const orders = selectedItems.map((it) => ({
        id: it.id,
        market_hash_name: it.market_hash_name,
        price: itemPrices[it.id] ?? (it.price ?? 0) * 0.9,
      }));

      const r = await fetch(`/api/user/create-sell-order`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orders }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setSellMessage(j?.message || "Erro ao criar ordem de venda.");
        setProcessingSell(false);
        return;
      }

      // sucesso — atualize o balanço do usuário (recarrega me) e fecha
      await loadAll();
      setSellMessage("Ordem criada com sucesso. Verifique suas vendas em Minhas Vendas.");
      setProcessingSell(false);
      setSellMode(false);
    } catch (err) {
      console.error(err);
      setSellMessage("Erro ao criar ordem de venda.");
      setProcessingSell(false);
    }
  }

  if (loading) return <div className="p-6">Carregando perfil e mercado...</div>;
  if (error) return <div className="p-6 text-red-500">Erro: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* PROFILE HEADER */}
      <div className="bg-neutral-900/60 p-6 rounded-2xl shadow-lg flex items-center gap-6">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">PS</div>
          )}
        </div>

        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-100">{user?.display_name ?? user?.id}</div>
          <div className="text-sm text-gray-400">Steam ID: {user?.id}</div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-extrabold text-yellow-400">R$ {(user?.balance ?? 0).toFixed(2)}</div>
          <div className="text-sm text-gray-400">Saldo</div>
          <div className="mt-3">
            <button onClick={openSellPage} className="px-4 py-2 bg-green-600 rounded font-semibold">Vender skins</button>
          </div>
        </div>
      </div>

      {/* MARKET / ALL ITEMS */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-3">Itens disponíveis (todos os bots)</h3>

        {loadingInventory ? (
          <div>Carregando inventários dos bots...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((it) => (
              <div key={it.id} className="bg-neutral-900/50 rounded p-3 flex flex-col hover:scale-[1.01] transition-transform">
                <div className="h-32 w-full bg-neutral-800 rounded overflow-hidden flex items-center justify-center mb-2">
                  <img src={resolveImageUrl(it.icon_url)} alt={it.market_hash_name} className="h-full w-full object-cover" />
                </div>
                <div className="text-sm text-gray-200 font-medium truncate">{it.market_hash_name}</div>
                <div className="text-xs text-gray-400 mt-1">{it.tradable ? "Tradable" : "Não negociável"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SELL PAGE (modal/new-page like) */}
      {sellMode && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start overflow-auto">
          <div className="bg-neutral-900/95 w-full max-w-6xl mx-auto mt-12 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Vender skins</h2>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-300">{userInventory ? `${userInventory.length} itens carregados` : "—"}</div>
                <button className="text-sm text-gray-300" onClick={() => setSellMode(false)}>Fechar</button>
              </div>
            </div>

            <div className="mt-4">
              {sellMessage && <div className="p-3 bg-yellow-600/10 border border-yellow-600 text-yellow-300 rounded">{sellMessage}</div>}

              {inventoryPrivate && (
                <div className="mt-3 text-red-400">Seu inventário está privado. Ajuste no Steam e tente novamente.</div>
              )}

              {!userInventory && !inventoryPrivate && (
                <div className="mt-6 flex items-center gap-3 text-gray-300">
                  <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="3" stroke="currentColor" fill="none" /></svg>
                  <span>Aguardando verificação do inventário...</span>
                </div>
              )}

              {userInventory && userInventory.length === 0 && (
                <div className="mt-4 text-gray-400">Seu inventário público está vazio ou sem itens vendáveis.</div>
              )}

              {userInventory && userInventory.length > 0 && (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left: items grid (spans 2 columns) */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {userInventory.map((it) => {
                        const recommended = (it.price ?? 0) * 0.9;
                        const userVal = itemPrices[it.id] ?? recommended;
                        const selected = !!checkedIds[it.id];
                        return (
                          <div
                            key={it.id}
                            onClick={() => toggleCheck(it.id)}
                            role="button"
                            aria-pressed={selected}
                            className={`relative p-2 rounded-lg border ${selected ? "border-green-500 bg-neutral-800/60 ring-2 ring-green-500" : "border-neutral-800 bg-neutral-800/30"} cursor-pointer hover:scale-[1.01] transition-transform`}
                          >
                            <div className="w-full h-28 rounded overflow-hidden bg-neutral-700 flex items-center justify-center">
                              <img src={resolveImageUrl(it.icon_url)} alt={it.market_hash_name} className="w-full h-full object-cover" />
                            </div>

                            <div className="mt-2">
                              <div className="text-sm font-medium text-gray-100 truncate">{it.market_hash_name}</div>
                              <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                                <div>Steam: R$ {(it.price ?? 0).toFixed(2)}</div>
                                <div className="text-gray-300">-10%: R$ {recommended.toFixed(2)}</div>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={(userVal ?? 0).toFixed(2)}
                                onChange={(e) => setCustomPrice(it.id, Number(e.target.value || 0))}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-neutral-700/20 rounded px-2 py-1 text-sm"
                                aria-label={`Preço para ${it.market_hash_name}`}
                              />
                            </div>

                            {/* small badge: selected */}
                            {selected && (
                              <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">Selecionado</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: summary / checkout */}
                  <div className="p-4 rounded-lg bg-neutral-800/40">
                    <div className="text-sm text-gray-300">Itens selecionados</div>
                    <div className="text-3xl font-extrabold text-green-400 mt-2">{selectedItems.length}</div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-300">
                        <div>Subtotal</div>
                        <div>R$ {totals.subtotal.toFixed(2)}</div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-300 mt-2">
                        <div>Taxa do site (5%)</div>
                        <div>- R$ {(totals.subtotal * 0.05).toFixed(2)}</div>
                      </div>
                      <hr className="my-3 border-neutral-700" />
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-300">Você receberá</div>
                        <div className="text-2xl font-extrabold text-green-400">R$ {totals.payout.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <button disabled={processingSell || selectedItems.length === 0} onClick={submitSell} className="px-4 py-3 bg-green-600 rounded font-bold">{processingSell ? 'Processando...' : 'Confirmar venda'}</button>
                      <button onClick={() => { setSellMode(false); }} className="px-4 py-3 border rounded">Cancelar</button>
                    </div>

                    {sellMessage && <div className="mt-3 text-yellow-300">{sellMessage}</div>}

                    <div className="mt-4 text-xs text-gray-400">Dica: clique no card do item para selecionar. Ajuste o preço manualmente se quiser mais controle.</div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


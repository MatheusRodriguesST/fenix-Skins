// src/components/SellModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Heart, Eye, ShoppingCart, User, Plus, Minus, LogIn, CreditCard, Trash2, Settings, LogOut, Wallet, Clock, Gavel } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found. Check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  throw new Error("Supabase environment variables missing.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface SellModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  addNotification: (message: string, type: "success" | "error" | "info") => void;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  loadUserItems: () => void;
}

interface InventoryItem {
  id: string;
  assetid: string;
  name: string;
  image: string | null;
  classid: string;
  instanceid: string;
  rarity: string;
  condition: string;
  stickers: string[];
  charms: string[]; // Assuming charms are parsed similarly
  float?: number; // Float value, if available
  tradable: boolean;
}

function parseInventoryItem(raw: any): InventoryItem {
  const fullName = raw.name || "Unknown Item";
  const { weapon, skin, condition } = parseFullName(fullName); // Reuse from main code
  const rarity = determineRarityFromTags(raw.tags || []); // New function
  const stickers = parseStickers(raw.descriptions || []);
  const charms = parseCharms(raw.descriptions || []); // Placeholder
  const image = raw.image || null;

  return {
    id: raw.id,
    assetid: raw.assetid,
    name: fullName,
    image,
    classid: raw.classid,
    instanceid: raw.instanceid,
    rarity,
    condition: raw.condition || condition, // Fallback to parsed
    stickers,
    charms,
    float: undefined, // To get float, need inspect API, omitted for now
    tradable: raw.tradable,
  };
}

function determineRarityFromTags(tags: any[]): string {
  const rarityTag = tags.find((t: any) => t.category === "Rarity");
  if (!rarityTag) return "Unknown";

  switch (rarityTag.internal_name) {
    case "Rarity_Ancient": return "Covert";
    case "Rarity_Legendary": return "Classified";
    case "Rarity_Mythical": return "Restricted";
    case "Rarity_Rare": return "Mil-Spec";
    case "Rarity_Uncommon": return "Industrial Grade";
    case "Rarity_Common": return "Consumer Grade";
    default: return rarityTag.name || "Unknown";
  }
}

function parseStickers(descriptions: any[]): string[] {
  const stickerDesc = descriptions.find((d: any) => d.value?.startsWith("Sticker: "));
  if (stickerDesc) {
    return stickerDesc.value.replace("Sticker: ", "").split(", ").map((s: string) => s.trim());
  }
  return [];
}

function parseCharms(descriptions: any[]): string[] {
  // Placeholder: Adjust based on actual charm descriptions
  const charmDesc = descriptions.find((d: any) => d.value?.startsWith("Charm: "));
  if (charmDesc) {
    return charmDesc.value.replace("Charm: ", "").split(", ").map((s: string) => s.trim());
  }
  return [];
}

export default function SellModal({ user, isOpen, onClose, addNotification, setUser, loadUserItems }: SellModalProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: { item: InventoryItem; price: number } }>({});

  useEffect(() => {
    if (isOpen && user) {
      loadUserInventory();
    }
  }, [isOpen, user]);

  async function loadUserInventory() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventory/${user.id}`); // Assuming user.id is steamId
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const json = await res.json();
      if (json.ok && json.items) {
        const parsed = json.items.map(parseInventoryItem);
        setInventory(parsed);
      } else {
        setError("No items found");
      }
    } catch (err) {
      console.error("loadUserInventory error", err);
      setError("Error loading inventory");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMarketPrice(name: string): Promise<number> {
    try {
      const res = await fetch(`/api/market/price?market_hash_name=${encodeURIComponent(name)}`);
      const json = await res.json();
      return json.ok ? json.price : suggestPriceFromName(name); // Fallback to mock
    } catch {
      return suggestPriceFromName(name);
    }
  }

  function toggleSelect(item: InventoryItem) {
    setSelectedItems((prev) => {
      if (prev[item.id]) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      } else {
        // Set default price
        fetchMarketPrice(item.name).then((price) => {
          setSelectedItems((p) => ({ ...p, [item.id]: { item, price } }));
        });
        return { ...prev, [item.id]: { item, price: 0 } }; // Temp
      }
    });
  }

  function updatePrice(id: string, price: number) {
    setSelectedItems((prev) => ({ ...prev, [id]: { ...prev[id], price } }));
  }

  async function confirmSell() {
    if (!user || Object.keys(selectedItems).length === 0) return;

    try {
      for (const { item, price } of Object.values(selectedItems)) {
        // Post to API for security
        const res = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seller_id: user.id,
            item: {
              ...item,
              displayName: item.name,
              weapon: parseFullName(item.name).weapon,
              skin: parseFullName(item.name).skin,
              condition: item.condition,
              price,
              rarity: item.rarity,
              stickers: item.stickers,
              charms: item.charms,
              float: item.float,
            },
            price,
          }),
        });
        if (!res.ok) throw new Error("Failed to list item");
      }
      addNotification("Items listed for sale!", "success");
      setSelectedItems({});
      onClose();
      loadUserItems(); // Refresh inventory
    } catch (err) {
      console.error("confirmSell error", err);
      addNotification("Error listing items", "error");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-neutral-900/95 rounded-3xl p-6 max-w-2xl w-full mx-4 shadow-2xl overflow-y-auto max-h-[80vh]" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", damping: 15, stiffness: 200 }}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-100">Vender Itens</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-200"><X className="w-6 h-6" /></button>
            </div>
            <p className="text-sm text-gray-300 mb-6">Selecione itens do seu inventário para vender. Preços sugeridos baseados no mercado Steam.</p>

            {loading ? (
              <div className="text-center py-8">Carregando inventário...</div>
            ) : error ? (
              <div className="text-red-400 text-center py-8">{error}</div>
            ) : inventory.length === 0 ? (
              <div className="text-gray-300 text-center py-8">Nenhum item disponível para venda.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {inventory.map((item) => (
                  <div key={item.id} className={`p-4 bg-neutral-800/50 rounded-xl border ${selectedItems[item.id] ? "border-yellow-500" : "border-neutral-700"} cursor-pointer`} onClick={() => toggleSelect(item)}>
                    <img src={item.image || ""} alt={item.name} className="w-full h-24 object-contain mb-2" />
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.rarity} • {item.condition}</p>
                    {item.stickers.length > 0 && <p className="text-xs text-yellow-400">Stickers: {item.stickers.join(", ")}</p>}
                    {item.charms.length > 0 && <p className="text-xs text-purple-400">Charms: {item.charms.join(", ")}</p>}
                    {selectedItems[item.id] && (
                      <input
                        type="number"
                        value={selectedItems[item.id].price}
                        onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Preço"
                        className="mt-2 w-full bg-neutral-700/50 border border-yellow-700/50 rounded px-2 py-1 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={confirmSell} disabled={Object.keys(selectedItems).length === 0} className="flex-1 bg-yellow-500 text-black py-3 rounded-full font-bold disabled:opacity-50 hover:brightness-105 transition shadow">Vender Selecionados</button>
              <button onClick={onClose} className="px-6 py-3 border border-yellow-700/50 rounded-full font-bold hover:bg-yellow-800/50 transition">Cancelar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
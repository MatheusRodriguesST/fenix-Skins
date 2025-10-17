

// src/components/SellModal.tsx
// New or updated component for multi-select sell with visual grid

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ListingItem } from "../types";  // Assume types file or inline

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  addNotification: (msg: string, type: string) => void;
  loadUserItems: () => void;
  userItems: (ListingItem & { dbId?: string })[];  // Pass userItems from parent
}

export default function SellModal({ isOpen, onClose, user, addNotification, loadUserItems, userItems }: SellModalProps) {
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: { item: ListingItem, price: number } }>({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const steamItems = userItems.filter((item) => !item.dbId);  // Only sell Steam items, not DB purchased

  const toggleSelect = (item: ListingItem) => {
    setSelectedItems((prev) => {
      if (prev[item.id]) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      const steamPrice = item.price || 0;  // Assume item.price is steam_price_number
      const recommended = Number((steamPrice * 0.95).toFixed(2));
      return { ...prev, [item.id]: { item, price: recommended } };
    });
  };

  const updatePrice = (id: string, price: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], price: Number(price.toFixed(2)) },
    }));
  };

  async function confirmSell() {
    if (!user || Object.keys(selectedItems).length === 0) return;
    setLoading(true);
    try {
      const itemsToSell = Object.values(selectedItems).map(({ item, price }) => ({
        assetId: item.id,
        marketHashName: item.displayName,
        price,
      }));
      const res = await fetch("/api/sell-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToSell }),
        credentials: "include",
      });
      const json = await res.json();
      if (!json.ok) {
        addNotification(json.message || "Erro ao iniciar venda", "error");
      } else {
        addNotification("Ofertas de trade enviadas! Aceite para listar os itens.", "success");
        onClose();
        loadUserItems();  // Refresh to remove pending items if needed
      }
    } catch (err) {
      console.error("confirmSell error", err);
      addNotification("Erro ao iniciar venda", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-neutral-900 p-6 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Selecionar Itens para Vender</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {steamItems.map((item) => {
            const isSelected = !!selectedItems[item.id];
            const steamPrice = item.price || 0;
            const recommended = Number((steamPrice * 0.95).toFixed(2));
            const payout = Number((recommended * 0.95).toFixed(2));
            const userPrice = selectedItems[item.id]?.price || recommended;

            return (
              <motion.div
                key={item.id}
                className={`p-4 bg-neutral-800 rounded-xl cursor-pointer ${isSelected ? "border-2 border-green-500" : ""}`}
                onClick={() => toggleSelect(item)}
                whileHover={{ scale: 1.05 }}
              >
                <img src={item.image || ""} alt={item.displayName} className="w-full h-32 object-contain mb-2" />
                <p className="font-semibold">{item.displayName}</p>
                <p className="text-sm text-gray-400">Steam: ${steamPrice.toFixed(2)}</p>
                {isSelected && (
                  <>
                    <p className="text-sm">Recomendado: ${recommended.toFixed(2)}</p>
                    <p className="text-sm">Receberá: ${Number((userPrice * 0.95).toFixed(2))}</p>
                    <input
                      type="number"
                      value={userPrice}
                      onChange={(e) => updatePrice(item.id, parseFloat(e.target.value))}
                      className="w-full p-1 bg-neutral-700 rounded mt-1"
                      step="0.01"
                      min="0"
                    />
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-red-600 rounded">Cancelar</button>
          <button onClick={confirmSell} disabled={loading || Object.keys(selectedItems).length === 0} className="px-4 py-2 bg-green-600 rounded">
            {loading ? "Enviando..." : "Confirmar Venda"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
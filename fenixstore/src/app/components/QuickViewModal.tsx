// src/components/QuickViewModal.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Item {
  id: string;
  skin: string;
  weapon: string;
  condition: string;
  rarity: string;
  image?: string | null;
  price: number;
  stickers?: string[];
  charms?: string[];
  float?: number;
  pattern?: number;
}

interface QuickViewModalProps {
  quickViewItem: Item | null;
  setQuickViewItem: (item: null) => void;
  addToCart: (item: Item) => void;
  setCartOpen: (open: boolean) => void;
  user: any | null;
  setError: (err: string) => void;
  getRarityColor: (rarity: string) => string;
  calcPayout: (price: number) => number;
}

export default function QuickViewModal({
  quickViewItem,
  setQuickViewItem,
  addToCart,
  setCartOpen,
  user,
  setError,
  getRarityColor,
  calcPayout,
}: QuickViewModalProps) {
  if (!quickViewItem) return null;

  return (
    <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQuickViewItem(null)}>
      <motion.div className="bg-neutral-900/95 rounded-3xl p-6 max-w-lg w-full mx-4 shadow-2xl relative overflow-hidden" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", damping: 15, stiffness: 200 }} onClick={(e) => e.stopPropagation()}>
        {/* RarityParticles omitted */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-100">{quickViewItem.skin}</h3>
            <p className="text-sm text-gray-300">{quickViewItem.weapon} • {quickViewItem.condition}</p>
            <p className={`text-sm font-bold text-${getRarityColor(quickViewItem.rarity)} uppercase`}>{quickViewItem.rarity}</p>
          </div>
          <button onClick={() => setQuickViewItem(null)} className="text-gray-400 hover:text-gray-200"><X className="w-6 h-6" /></button>
        </div>

        <div className="relative w-full h-48 bg-neutral-800/50 rounded-2xl overflow-hidden mb-6 flex items-center justify-center shadow-inner">
          {quickViewItem.image && <img src={quickViewItem.image} className="max-h-44 object-contain" />}
          {/* Charms in top-right corner */}
          {quickViewItem.charms?.length > 0 && (
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {quickViewItem.charms.slice(0, 2).map((charm, i) => (
                <div key={i} className="w-8 h-8 bg-purple-500/80 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-lg">
                  {charm.charAt(0).toUpperCase()}
                </div>
              ))}
              {quickViewItem.charms.length > 2 && (
                <div className="w-8 h-8 bg-purple-500/80 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-lg">
                  +{quickViewItem.charms.length - 2}
                </div>
              )}
            </div>
          )}
          {/* Stickers below image */}
          {quickViewItem.stickers?.length > 0 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              {quickViewItem.stickers.slice(0, 4).map((sticker, i) => (
                <div key={i} className="w-6 h-6 bg-yellow-500/80 rounded flex items-center justify-center text-xs text-black font-bold shadow-md">
                  {sticker.charAt(0).toUpperCase()}
                </div>
              ))}
              {quickViewItem.stickers.length > 4 && (
                <div className="w-6 h-6 bg-yellow-500/80 rounded flex items-center justify-center text-xs text-black font-bold shadow-md">
                  +{quickViewItem.stickers.length - 4}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm mb-6">
          <div>
            <p className="text-gray-300">Preço</p>
            <p className="text-lg font-bold text-yellow-400">R$ {quickViewItem.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-300">Você recebe</p>
            <p className="text-lg font-bold text-green-400">R$ {calcPayout(quickViewItem.price).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-300">Float</p>
            <p className="text-sm">{quickViewItem.float?.toFixed(4) || "N/A"}</p>
          </div>
          <div>
            <p className="text-gray-300">Pattern</p>
            <p className="text-sm">{quickViewItem.pattern || "N/A"}</p>
          </div>
          {quickViewItem.stickers?.length > 0 && (
            <div className="col-span-2">
              <p className="text-gray-300">Stickers</p>
              <p className="text-sm">{quickViewItem.stickers.join(", ")}</p>
            </div>
          )}
          {quickViewItem.charms?.length > 0 && (
            <div className="col-span-2">
              <p className="text-gray-300">Charms</p>
              <p className="text-sm">{quickViewItem.charms.join(", ")}</p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button onClick={() => { if (!user) { setError("Você precisa estar logado para comprar."); return; } addToCart(quickViewItem); setQuickViewItem(null); }} className="flex-1 bg-yellow-500 text-black py-3 rounded-full font-bold shadow hover:brightness-105 transition">Adicionar ao carrinho</button>
          <button onClick={() => { if (!user) { setError("Você precisa estar logado para comprar."); return; } addToCart(quickViewItem); setCartOpen(true); setQuickViewItem(null); }} className="flex-1 border border-yellow-700/50 py-3 rounded-full font-bold hover:bg-yellow-800/50 transition">Comprar agora</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
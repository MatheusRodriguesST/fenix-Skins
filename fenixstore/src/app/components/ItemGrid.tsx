// src/components/ItemGrid.tsx
import React from "react";
import { motion } from "framer-motion";
import { Heart, Eye, Gavel, Clock } from "lucide-react";

interface Item {
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
  // For auction
  auctionId?: string;
  currentBid?: number;
  endTime?: Date;
}

interface ItemGridProps {
  viewMode: "market" | "auction" | "inventory";
  pageItems: Item[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  setQuickViewItem: (item: Item) => void;
  addToCart: (item: Item) => void;
  bidInputs: { [id: string]: number };
  setBidInputs: (inputs: { [id: string]: number }) => void;
  placeBid: (item: Item) => void;
  setSelectedItemForAuction: (item: Item) => void;
  setShowAuctionModal: (show: boolean) => void;
  getRarityColor: (rarity: string) => string;
  getRarityGlow: (rarity: string) => string;
  getConditionColor: (condition: string) => string;
  calcPayout: (price: number) => number;
  user: any | null;
  setError: (err: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      type: "spring",
      damping: 15,
      stiffness: 100,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ItemGrid({
  viewMode,
  pageItems,
  favorites,
  toggleFavorite,
  setQuickViewItem,
  addToCart,
  bidInputs,
  setBidInputs,
  placeBid,
  setSelectedItemForAuction,
  setShowAuctionModal,
  getRarityColor,
  getRarityGlow,
  getConditionColor,
  calcPayout,
  user,
}: ItemGridProps) {
  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {pageItems.map((it) => (
        <motion.div
          key={it.id}
          variants={itemVariants}
          className={`bg-gradient-to-br from-neutral-900/40 to-yellow-900/20 rounded-3xl border border-${getRarityColor(it.rarity)}/50 p-4 hover:shadow-2xl hover:${getRarityGlow(it.rarity)} transition-all relative group overflow-hidden`}
          whileHover={{ scale: 1.05, rotate: [0, 1, -1, 0], transition: { duration: 0.3, ease: "easeInOut" } }}
        >
          {/* RarityParticles omitted for brevity, add if needed */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => toggleFavorite(it.id)} className={`p-2 rounded-full shadow ${favorites.includes(it.id) ? "bg-yellow-500 text-black" : "bg-neutral-800/70 text-gray-200"}`}><Heart className="w-5 h-5" /></button>
            <button onClick={() => setQuickViewItem(it)} className="p-2 rounded-full bg-neutral-800/70 text-gray-200 shadow"><Eye className="w-5 h-5" /></button>
          </div>

          <div className="w-full h-32 bg-neutral-800/50 rounded-2xl overflow-hidden flex items-center justify-center mb-4 shadow-inner">
            {it.image ? (
              <motion.img
                src={it.image}
                alt={it.displayName}
                className="max-h-28 object-contain transition-transform group-hover:scale-110"
                whileHover={{ rotate: [0, 5, -5, 0], transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" } }}
              />
            ) : (
              <p className="text-sm text-gray-500">Sem imagem</p>
            )}
          </div>

          <div className="text-left">
            <h3 className="text-base font-bold text-gray-100 truncate">{it.skin}</h3>
            <p className="text-sm text-gray-300 truncate">{it.weapon}</p>
            <p className={`text-sm font-semibold ${getConditionColor(it.condition)} mt-1`}>{it.condition}</p>
            <p className={`text-xs font-bold text-${getRarityColor(it.rarity)} uppercase mt-1`}>{it.rarity}</p>
            {it.stickers?.length > 0 && <p className="text-xs text-yellow-300">Stickers: {it.stickers.join(", ")}</p>}
            {it.charms?.length > 0 && <p className="text-xs text-purple-300">Charms: {it.charms.join(", ")}</p>}
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold text-yellow-400">R$ {viewMode === "auction" ? it.currentBid?.toFixed(2) : it.price.toFixed(2)}</p>
                {viewMode === "auction" && it.endTime && (
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor((it.endTime.getTime() - Date.now()) / 3600000)} horas restantes</p>
                )}
                <p className="text-xs text-gray-400">Recebe: R$ {calcPayout(viewMode === "auction" ? it.currentBid || 0 : it.price).toFixed(2)}</p>
              </div>
              {viewMode === "market" ? (
                <button onClick={() => addToCart(it)} className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold hover:brightness-105 transition shadow">Adicionar</button>
              ) : viewMode === "auction" ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    value={bidInputs[it.id] || ""}
                    onChange={(e) => setBidInputs({...bidInputs, [it.id]: Number(e.target.value)})}
                    placeholder="Seu lance"
                    className="w-20 bg-neutral-800/50 border border-yellow-700/50 rounded-full px-2 py-1 text-sm"
                  />
                  <button onClick={() => placeBid(it)} className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold hover:brightness-105 transition shadow flex items-center gap-1"><Gavel className="w-4 h-4" /> Lancar</button>
                </div>
              ) : (
                <button onClick={() => { setSelectedItemForAuction(it); setShowAuctionModal(true); }} className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold hover:brightness-105 transition shadow flex items-center gap-1"><Gavel className="w-4 h-4" /> Leiloar</button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
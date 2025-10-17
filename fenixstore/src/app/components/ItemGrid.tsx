// src/components/ItemGrid.tsx
import React from "react";
import { motion } from "framer-motion";
import { Heart, Eye, Gavel, Clock, Sticker, Link2 } from "lucide-react";

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
  setQuickViewItem: (item: Item | null) => void;
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
  setError,
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
          className={`bg-gradient-to-br from-neutral-900/40 to-yellow-900/20 rounded-3xl border border-${getRarityColor(it.rarity)}/50 p-4 hover:shadow-2xl hover:${getRarityGlow(it.rarity)} transition-all relative group overflow-hidden cursor-pointer`}
          whileHover={{ scale: 1.05, rotate: [0, 1, -1, 0], transition: { duration: 0.3, ease: "easeInOut" } }}
          onClick={() => setQuickViewItem(it)} // Abre modal ao clicar no card
        >
          {/* RarityParticles omitted for brevity, add if needed */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(it.id); }} className={`p-2 rounded-full shadow ${favorites.includes(it.id) ? "bg-yellow-500 text-black" : "bg-neutral-800/70 text-gray-200"}`}><Heart className="w-5 h-5" /></button>
            <button onClick={(e) => { e.stopPropagation(); setQuickViewItem(it); }} className="p-2 rounded-full bg-neutral-800/70 text-gray-200 shadow"><Eye className="w-5 h-5" /></button>
          </div>

          <div className="relative w-full h-32 bg-neutral-800/50 rounded-2xl overflow-hidden flex items-center justify-center mb-4 shadow-inner group/image">
            {it.image ? (
              <motion.img
                src={it.image}
                alt={it.displayName}
                className="max-h-28 object-contain transition-transform group-hover/image:scale-110 cursor-pointer"
                whileHover={{ rotate: [0, 5, -5, 0], transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" } }}
                onClick={(e) => { e.stopPropagation(); setQuickViewItem(it); }} // Abre modal ao clicar na imagem
              />
            ) : (
              <p className="text-sm text-gray-500">Sem imagem</p>
            )}
            {/* Charms in top-right corner, minimal */}
            {it.charms?.length > 0 && (
              <div className="absolute top-1 right-1 flex flex-col gap-1">
                {it.charms.slice(0, 2).map((charm, i) => (
                  <div key={i} className="w-5 h-5 bg-purple-400/80 rounded flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                    <Link2 className="w-2 h-2" />
                  </div>
                ))}
                {it.charms.length > 2 && (
                  <div className="w-5 h-5 bg-purple-400/80 rounded flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                    +{it.charms.length - 2}
                  </div>
                )}
              </div>
            )}
            {/* Stickers below image, minimal horizontal bar */}
            {it.stickers?.length > 0 && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5 bg-black/50 rounded px-1 py-0.5">
                {it.stickers.slice(0, 3).map((sticker, i) => (
                  <div key={i} className="w-3 h-3 bg-yellow-400/80 rounded flex items-center justify-center text-[8px] text-black font-bold shadow-sm">
                    <Sticker className="w-1.5 h-1.5" />
                  </div>
                ))}
                {it.stickers.length > 3 && (
                  <div className="w-3 h-3 bg-yellow-400/80 rounded flex items-center justify-center text-[8px] text-black font-bold shadow-sm ml-0.5">
                    +{it.stickers.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-left mt-2">
            <h3 className="text-base font-bold text-gray-100 truncate">{it.skin}</h3>
            <p className="text-sm text-gray-300 truncate">{it.weapon}</p>
            <p className={`text-sm font-semibold ${getConditionColor(it.condition)} mt-1`}>{it.condition}</p>
            <p className={`text-xs font-bold text-${getRarityColor(it.rarity)} uppercase mt-1`}>{it.rarity}</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold text-yellow-400">R$ {viewMode === "auction" ? it.currentBid?.toFixed(2) : it.price.toFixed(2)}</p>
                {viewMode === "auction" && it.endTime && (
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor((it.endTime.getTime() - Date.now()) / 3600000)} horas restantes</p>
                )}
                <p className="text-xs text-gray-400">Recebe: R$ {calcPayout(viewMode === "auction" ? it.currentBid || 0 : it.price).toFixed(2)}</p>
              </div>
              <div className="flex flex-col gap-2">
                {viewMode === "market" ? (
                  <button onClick={(e) => { e.stopPropagation(); addToCart(it); }} className="bg-yellow-500 text-black px-3 py-1.5 rounded-full text-xs font-bold hover:brightness-105 transition shadow">Adicionar</button>
                ) : viewMode === "auction" ? (
                  <>
                    <input
                      type="number"
                      value={bidInputs[it.id] || ""}
                      onChange={(e) => setBidInputs({...bidInputs, [it.id]: Number(e.target.value)})}
                      placeholder="Lance"
                      className="w-16 bg-neutral-800/50 border border-yellow-700/50 rounded-full px-2 py-1 text-xs text-center"
                    />
                    <button onClick={(e) => { e.stopPropagation(); placeBid(it); }} className="bg-yellow-500 text-black px-3 py-1.5 rounded-full text-xs font-bold hover:brightness-105 transition shadow flex items-center justify-center gap-1"><Gavel className="w-3 h-3" /></button>
                  </>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedItemForAuction(it); setShowAuctionModal(true); }} className="bg-yellow-500 text-black px-3 py-1.5 rounded-full text-xs font-bold hover:brightness-105 transition shadow flex items-center justify-center gap-1"><Gavel className="w-3 h-3" /></button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
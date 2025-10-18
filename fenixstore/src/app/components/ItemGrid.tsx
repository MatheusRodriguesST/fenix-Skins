// src/components/ItemGrid.tsx
import React from "react";
import { motion } from "framer-motion";
import { Heart, Eye, Gavel, Clock, Sticker, Link2 } from "lucide-react";

// Props permanecem as mesmas
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
  getRarityColor: (rarity: string) => string; // ex: 'yellow-400'
  getRarityGlow: (rarity: string) => string; // ex: '#facc15' (código da cor)
  getConditionColor: (condition: string) => string;
  calcPayout: (price: number) => number;
  user: any | null;
  setError: (err: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

// Componente para um slot de Sticker, para clareza
const StickerSlot = ({ hasSticker }: { hasSticker: boolean }) => (
    <div className={`w-6 h-6 rounded-md border border-yellow-200/20 flex items-center justify-center ${hasSticker ? 'bg-yellow-500/20' : 'bg-black/30'}`}>
        {hasSticker && <Sticker className="w-3.5 h-3.5 text-yellow-300" />}
    </div>
);

export default function ItemGrid({
  viewMode, pageItems, favorites, toggleFavorite, setQuickViewItem,
  addToCart, bidInputs, setBidInputs, placeBid, setSelectedItemForAuction,
  setShowAuctionModal, getRarityColor, getRarityGlow, getConditionColor,
  calcPayout, user, setError
}: ItemGridProps) {
  
  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {pageItems.map((it) => (
        <motion.div
          key={it.id}
          variants={itemVariants}
          className="bg-neutral-900/50 rounded-3xl border border-neutral-700/80 p-1.5 transition-all duration-300 relative group overflow-hidden cursor-pointer"
          style={{
            '--rarity-glow': getRarityGlow(it.rarity),
            '--rarity-border': getRarityGlow(it.rarity) // Reutiliza a cor para a borda
          } as React.CSSProperties}
          whileHover={{ 
            scale: 1.03, 
            boxShadow: '0px 0px 25px -5px var(--rarity-glow)',
            borderColor: 'var(--rarity-border)',
          }}
          onClick={() => setQuickViewItem(it)}
        >
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(it.id); }} className={`p-2 rounded-full shadow-lg backdrop-blur-sm ${favorites.includes(it.id) ? "bg-yellow-500/80 text-black" : "bg-neutral-800/80 text-gray-200"}`}><Heart className="w-5 h-5" /></button>
            <button onClick={(e) => { e.stopPropagation(); setQuickViewItem(it); }} className="p-2 rounded-full bg-neutral-800/80 text-gray-200 shadow-lg backdrop-blur-sm"><Eye className="w-5 h-5" /></button>
          </div>

          {/* Imagem e Overlays de Sticker/Charm */}
          <div className="relative w-full h-40 bg-gradient-to-br from-neutral-800 to-neutral-900/50 rounded-2xl flex items-center justify-center mb-3 shadow-inner overflow-hidden">
            {it.image ? (
              <motion.img
                src={it.image}
                alt={it.displayName}
                className="max-h-32 object-contain transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <p className="text-sm text-gray-500">Sem imagem</p>
            )}

            {/* Overlay para Charms */}
            {it.charms && it.charms.length > 0 && (
                <div className="absolute top-2 left-2 p-1.5 bg-purple-900/50 backdrop-blur-sm rounded-full shadow-lg">
                    <Link2 className="w-4 h-4 text-purple-300" />
                </div>
            )}
            
            {/* Bandeja de Stickers */}
            <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex justify-center items-center gap-2">
                    {[...Array(4)].map((_, i) => (
                        <StickerSlot key={i} hasSticker={!!it.stickers && i < it.stickers.length} />
                    ))}
                </div>
            </div>
          </div>
          
          {/* Informações do Item */}
          <div className="px-2.5 pb-2 text-left">
            <p className={`text-xs font-bold uppercase text-${getRarityColor(it.rarity)}`}>{it.rarity}</p>
            <h3 className="text-base font-bold text-gray-100 truncate mt-0.5">{it.skin}</h3>
            <p className="text-sm text-gray-400 truncate">{it.weapon}</p>
            
            <div className="flex justify-between items-end mt-3">
              <div>
                <p className={`text-sm font-semibold ${getConditionColor(it.condition)}`}>{it.condition}</p>
                <p className="text-lg font-extrabold text-yellow-400 mt-1">
                  R$ {viewMode === "auction" ? it.currentBid?.toFixed(2) : it.price.toFixed(2)}
                </p>
              </div>

              <div className="text-right">
                {viewMode === "market" && (
                  <button onClick={(e) => { e.stopPropagation(); addToCart(it); }} className="bg-yellow-500 text-black px-4 py-2 rounded-full text-xs font-bold hover:brightness-110 transition shadow-lg shadow-yellow-500/20">Adicionar</button>
                )}
                {viewMode === "auction" && (
                   <button onClick={(e) => { e.stopPropagation(); placeBid(it); }} className="bg-yellow-500 text-black px-4 py-2 rounded-full text-xs font-bold hover:brightness-110 transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-1.5"><Gavel className="w-3.5 h-3.5" /> Dar Lance</button>
                )}
                 {viewMode === "inventory" && (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedItemForAuction(it); setShowAuctionModal(true); }} className="bg-yellow-500 text-black px-4 py-2 rounded-full text-xs font-bold hover:brightness-110 transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-1.5"><Gavel className="w-3.5 h-3.5" /> Leiloar</button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
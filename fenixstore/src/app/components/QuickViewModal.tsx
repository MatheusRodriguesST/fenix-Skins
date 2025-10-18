// src/components/QuickViewModal.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sticker, Link2, Percent, GripVertical, ShoppingCart } from "lucide-react";

// A interface do Item permanece a mesma
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
  getRarityColor: (rarity: string) => string; // ex: 'yellow-400'
  getRarityGlow: (rarity: string) => string; // ex: '#facc15' (código da cor)
  calcPayout: (price: number) => number;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 50 },
  visible: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } },
  exit: { scale: 0.9, opacity: 0, y: 50, transition: { duration: 0.2 } },
};

export default function QuickViewModal({
  quickViewItem, setQuickViewItem, addToCart, setCartOpen, user, setError, getRarityColor, getRarityGlow, calcPayout,
}: QuickViewModalProps) {
  return (
    <AnimatePresence>
      {quickViewItem && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={() => setQuickViewItem(null)}
        >
          <motion.div
            className="bg-gradient-to-br from-neutral-900 to-neutral-900/80 rounded-3xl p-6 max-w-2xl w-full mx-4 border shadow-2xl"
            style={{ 
              '--rarity-glow': getRarityGlow(quickViewItem.rarity),
              borderColor: `rgba(${parseInt(getRarityGlow(quickViewItem.rarity).slice(1, 3), 16)}, ${parseInt(getRarityGlow(quickViewItem.rarity).slice(3, 5), 16)}, ${parseInt(getRarityGlow(quickViewItem.rarity).slice(5, 7), 16)}, 0.3)`
            } as React.CSSProperties}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-yellow-700/20">
              <div>
                <p className={`text-sm font-bold uppercase text-${getRarityColor(quickViewItem.rarity)}`}>{quickViewItem.rarity}</p>
                <h2 className="text-2xl font-bold text-gray-100">{quickViewItem.skin}</h2>
                <p className="text-md text-gray-400">{quickViewItem.weapon} • {quickViewItem.condition}</p>
              </div>
              <button onClick={() => setQuickViewItem(null)} className="p-2 rounded-full text-gray-400 hover:bg-neutral-800 hover:text-gray-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Corpo Principal: Imagem e Detalhes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna da Imagem */}
              <div className="flex flex-col">
                <div 
                  className="relative w-full h-56 bg-neutral-800/50 rounded-2xl flex items-center justify-center shadow-inner mb-4"
                  style={{ boxShadow: `0px 0px 20px -5px var(--rarity-glow)` }}
                >
                  {quickViewItem.image ? 
                    <img src={quickViewItem.image} alt={quickViewItem.skin} className="max-h-48 object-contain" />
                   : <p className="text-gray-500">Sem Imagem</p>
                  }
                </div>
                {/* Bandeja de Inspeção de Stickers */}
                {quickViewItem.stickers && quickViewItem.stickers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Stickers Aplicados</h4>
                    <div className="grid grid-cols-4 gap-3 bg-neutral-950/50 p-3 rounded-xl border border-yellow-700/20">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-yellow-200/20 flex items-center justify-center bg-black/30">
                          {i < quickViewItem.stickers!.length && <Sticker className="w-6 h-6 text-yellow-300/70" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna de Detalhes */}
              <div className="flex flex-col gap-4">
                {/* Atributos Chave */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Atributos Chave</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-950/50 p-3 rounded-xl border border-yellow-700/20">
                      <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1"><Percent className="w-4 h-4" /> FLOAT</div>
                      <p className="text-lg font-mono text-gray-100">{quickViewItem.float?.toFixed(6) || "N/A"}</p>
                    </div>
                     <div className="bg-neutral-950/50 p-3 rounded-xl border border-yellow-700/20">
                      <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1"><GripVertical className="w-4 h-4" /> PATTERN</div>
                      <p className="text-lg font-mono text-gray-100">{quickViewItem.pattern || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Lista de Stickers e Charms */}
                {(quickViewItem.stickers?.length > 0 || quickViewItem.charms?.length > 0) && (
                  <div className="space-y-3 text-sm">
                    {quickViewItem.stickers && quickViewItem.stickers.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-300">Stickers:</h4>
                        <ul className="list-inside list-disc text-gray-400 ml-1">
                          {quickViewItem.stickers.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                     {quickViewItem.charms && quickViewItem.charms.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-300">Charms:</h4>
                        <ul className="list-inside list-disc text-gray-400 ml-1">
                           {quickViewItem.charms.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé: Preço e Ações */}
            <div className="mt-6 pt-4 border-t border-yellow-700/20 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-400">Preço</p>
                    <p className="text-3xl font-extrabold text-yellow-400">R$ {quickViewItem.price.toFixed(2)}</p>
                    <p className="text-xs text-green-400">Você recebe: R$ {calcPayout(quickViewItem.price).toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  <motion.button 
                    onClick={() => { if (!user) { setError("Você precisa estar logado para comprar."); return; } addToCart(quickViewItem); setQuickViewItem(null); }} 
                    className="flex-1 bg-yellow-500 text-black px-6 py-3 rounded-full font-bold shadow-lg shadow-yellow-500/20 flex items-center gap-2"
                    whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <ShoppingCart className="w-5 h-5" /> Adicionar
                  </motion.button>
                  <motion.button 
                    onClick={() => { if (!user) { setError("Você precisa estar logado para comprar."); return; } addToCart(quickViewItem); setCartOpen(true); setQuickViewItem(null); }} 
                    className="flex-1 border border-yellow-700/50 text-gray-200 px-6 py-3 rounded-full font-bold hover:bg-yellow-900/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    Comprar
                  </motion.button>
                </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
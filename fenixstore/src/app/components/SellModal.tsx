// src/components/SellModal.tsx

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, DollarSign, Package, Loader2, UserCheck } from "lucide-react";
import { ListingItem } from "../types"; // Certifique-se que o tipo está correto

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  addNotification: (msg: string, type: string) => void;
  loadUserItems: () => void;
  userItems: (ListingItem & { dbId?: string })[];
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const botTradeAnimation = {
  initial: { y: 0, rotate: 0 },
  animate: {
    y: [-10, 10, -10],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function SellModal({ isOpen, onClose, user, addNotification, loadUserItems, userItems }: SellModalProps) {
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: { item: ListingItem, price: number } }>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Filtra apenas itens do inventário Steam que podem ser vendidos
  const steamItems = userItems.filter((item) => !item.dbId);

  const toggleSelect = (item: ListingItem) => {
    setSelectedItems((prev) => {
      const newSelection = { ...prev };
      if (newSelection[item.id]) {
        delete newSelection[item.id];
      } else {
        const steamPrice = item.price || 0;
        const recommendedPrice = Number((steamPrice * 0.95).toFixed(2));
        newSelection[item.id] = { item, price: recommendedPrice };
      }
      return newSelection;
    });
  };

  const updatePrice = (id: string, priceStr: string) => {
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) return;
    setSelectedItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], price },
    }));
  };

  const summary = useMemo(() => {
    const itemsArray = Object.values(selectedItems);
    const totalPayout = itemsArray.reduce((acc, { price }) => acc + (price * 0.95), 0);
    return {
      count: itemsArray.length,
      totalPayout,
    };
  }, [selectedItems]);

  async function confirmSell() {
    if (!user || summary.count === 0) return;
    setLoading(true);
    try {
      const itemsToSell = Object.values(selectedItems).map(({ item, price }) => ({
        assetId: item.id,
        marketHashName: item.displayName,
        price,
      }));
      // Simulação de API, substitua pela sua lógica real
      const res = await fetch("/api/sell-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToSell }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Falha ao listar itens.");
      
      setShowSuccess(true);
      loadUserItems();
    } catch (err: any) {
      addNotification(err.message || "Ocorreu um erro.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div
        className="bg-neutral-900/80 border border-yellow-700/30 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-6 border-b border-neutral-700/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-100">
            {showSuccess ? "Troca Enviada!" : "Vender Itens do Inventário"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-neutral-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showSuccess ? (
            /* Corpo Principal (Grid + Sumário) */
            <motion.div
              key="main"
              className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              
              {/* Coluna 1: Inventário */}
              <div className="lg:col-span-2 bg-black/30 p-4 rounded-xl overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {steamItems.map((item) => {
                    const isSelected = !!selectedItems[item.id];
                    return (
                      <motion.div
                        key={item.id}
                        className="relative bg-neutral-800 rounded-lg p-3 cursor-pointer border-2 border-transparent transition-all"
                        onClick={() => toggleSelect(item)}
                        whileHover={{ scale: 1.05, backgroundColor: '#3f3f46' }}
                        animate={{ borderColor: isSelected ? '#22c55e' : 'transparent' }}
                      >
                        {isSelected && (
                          <motion.div className="absolute inset-0 bg-green-500/20 rounded-md flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                          </motion.div>
                        )}
                        <div className={`w-full h-24 flex items-center justify-center mb-2 transition-opacity ${isSelected ? 'opacity-40' : 'opacity-100'}`}>
                            <img src={item.image || ""} alt={item.displayName} className="max-h-full max-w-full object-contain" />
                        </div>
                        <p className={`text-xs font-semibold text-gray-100 truncate transition-opacity ${isSelected ? 'opacity-40' : 'opacity-100'}`}>{item.displayName}</p>
                        <p className={`text-xs text-gray-400 transition-opacity ${isSelected ? 'opacity-40' : 'opacity-100'}`}>Steam: R$ {item.price?.toFixed(2) || '0.00'}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Coluna 2: Itens Selecionados e Sumário */}
              <div className="flex flex-col bg-black/30 p-4 rounded-xl overflow-hidden">
                <h3 className="text-lg font-semibold mb-4 text-gray-200">Itens para Vender ({summary.count})</h3>
                <div className="flex-1 space-y-3 pr-2 overflow-y-auto">
                  <AnimatePresence>
                    {Object.values(selectedItems).length === 0 && (
                      <motion.div className="h-full flex flex-col items-center justify-center text-center text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Package className="w-12 h-12 mb-2"/>
                        <p>Selecione itens do seu inventário para adicionar aqui.</p>
                      </motion.div>
                    )}
                    {Object.values(selectedItems).map(({ item, price }) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-4 bg-neutral-800/70 p-3 rounded-lg"
                      >
                        <img src={item.image || ""} alt={item.displayName} className="w-16 h-16 object-contain flex-shrink-0 bg-neutral-700/50 rounded-md" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-100 truncate">{item.displayName}</p>
                          <p className="text-xs text-green-400">Você recebe: R$ {(price * 0.95).toFixed(2)}</p>
                          <div className="relative mt-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                            <input
                              type="number"
                              value={price}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updatePrice(item.id, e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded-md py-1 pl-7 pr-2 text-sm text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                              step="0.01" min="0.01"
                            />
                          </div>
                        </div>
                        <button onClick={() => toggleSelect(item)} className="p-2 rounded-full text-gray-400 hover:bg-neutral-700 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {/* Rodapé do Sumário */}
                <div className="mt-4 pt-4 border-t border-neutral-700/50">
                  <div className="flex justify-between items-center mb-4 text-gray-300">
                    <span className="font-semibold">Total a Receber:</span>
                    <span className="text-xl font-bold text-green-400">R$ {summary.totalPayout.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={onClose} className="w-full py-3 bg-neutral-700 text-gray-200 rounded-lg font-bold hover:bg-neutral-600 transition-colors">
                      Cancelar
                    </button>
                    <button
                      onClick={confirmSell}
                      disabled={loading || summary.count === 0}
                      className="w-full py-3 bg-yellow-500 text-black rounded-lg font-bold hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Vender ${summary.count} ${summary.count > 1 ? 'Itens' : 'Item'}`}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Tela de Sucesso */
            <motion.div
              key="success"
              className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden"
              variants={successVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Animação do Bot Fazendo Troca */}
              <motion.div
                className="relative mb-8"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {/* Fundo da Troca */}
                <motion.div
                  className="absolute inset-0 bg-neutral-800/50 rounded-2xl p-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  {/* Ícone do Bot (UserCheck como proxy para bot) */}
                  <motion.div
                    className="flex items-center justify-center mb-4"
                    variants={botTradeAnimation}
                  >
                    <UserCheck className="w-16 h-16 text-yellow-400" />
                  </motion.div>
                  
                  {/* Ícones da Troca: Pacote e Dólar */}
                  <motion.div
                    className="flex items-center justify-between w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <motion.div
                      className="flex flex-col items-center"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                    >
                      <Package className="w-12 h-12 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">Seus Itens</p>
                    </motion.div>
                    
                    <motion.div
                      className="flex items-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                    >
                      <DollarSign className="w-8 h-8 text-green-400 mx-2" />
                      <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full" />
                      <DollarSign className="w-8 h-8 text-green-400 mx-2" />
                    </motion.div>
                    
                    <motion.div
                      className="flex flex-col items-center"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.7, type: "spring" }}
                    >
                      <DollarSign className="w-12 h-12 text-yellow-400 mb-1" />
                      <p className="text-xs text-gray-500">Bot</p>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Conteúdo de Sucesso */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <CheckCircle2 className="w-24 h-24 text-green-400 mb-6" />
                <h2 className="text-3xl font-bold text-gray-100 mb-4">Troca Enviada com Sucesso!</h2>
                <p className="text-gray-300 text-lg mb-8 max-w-md">
                  {summary.count} {summary.count > 1 ? 'itens' : 'item'} foram enviados para o bot. 
                  Você tem <span className="font-bold text-yellow-400">10 minutos</span> para aceitar a oferta de troca no Steam.
                </p>
                <motion.button
                  onClick={onClose}
                  className="py-4 px-8 bg-yellow-500 text-black rounded-xl font-bold text-lg hover:brightness-110 transition-all shadow-lg shadow-yellow-500/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Fechar e Verificar Steam
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
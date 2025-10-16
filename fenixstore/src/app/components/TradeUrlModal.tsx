// src/components/TradeUrlModal.tsx
import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface TradeUrlModalProps {
  showTradeModal: boolean;
  setShowTradeModal: (show: boolean) => void;
  tradeUrlInput: string;
  setTradeUrlInput: (input: string) => void;
  savingTradeUrl: boolean;
  tradeMessage: string | null;
  saveTradeUrl: () => void;
}

export default function TradeUrlModal({
  showTradeModal,
  setShowTradeModal,
  tradeUrlInput,
  setTradeUrlInput,
  savingTradeUrl,
  tradeMessage,
  saveTradeUrl,
}: TradeUrlModalProps) {
  if (!showTradeModal) return null;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-neutral-900/95 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", damping: 15, stiffness: 200 }}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-100">Configurar Trade URL</h3>
          <button onClick={() => setShowTradeModal(false)} className="text-gray-400 hover:text-gray-200"><X className="w-6 h-6" /></button>
        </div>
        <p className="text-sm text-gray-300 mb-6">Insira sua URL de trocas do Steam para receber skins rapidamente.</p>
        <div className="mb-6">
          <input
            value={tradeUrlInput}
            onChange={(e) => setTradeUrlInput(e.target.value)}
            placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
            className="w-full bg-neutral-800/50 border border-yellow-700/50 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
          />
        </div>
        <button
          onClick={saveTradeUrl}
          disabled={savingTradeUrl || !tradeUrlInput.trim()}
          className="w-full bg-yellow-500 text-black py-3 rounded-full font-bold disabled:opacity-50 hover:brightness-105 transition shadow"
        >
          {savingTradeUrl ? "Salvando..." : "Salvar Trade URL"}
        </button>
        {tradeMessage && <p className={`mt-4 text-sm text-center ${tradeMessage.includes("sucesso") ? "text-green-400" : "text-red-400"}`}>{tradeMessage}</p>}
      </motion.div>
    </motion.div>
  );
}
// src/components/AuctionModal.tsx
import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface AuctionModalProps {
  showAuctionModal: boolean;
  setShowAuctionModal: (show: boolean) => void;
  minBid: number;
  setMinBid: (bid: number) => void;
  auctionTime: number;
  setAuctionTime: (time: number) => void;
  createAuction: () => void;
}

export default function AuctionModal({
  showAuctionModal,
  setShowAuctionModal,
  minBid,
  setMinBid,
  auctionTime,
  setAuctionTime,
  createAuction,
}: AuctionModalProps) {
  if (!showAuctionModal) return null;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-neutral-900/95 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", damping: 15, stiffness: 200 }}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-100">Listar para Leilão</h3>
          <button onClick={() => setShowAuctionModal(false)} className="text-gray-400 hover:text-gray-200"><X className="w-6 h-6" /></button>
        </div>
        <p className="text-sm text-gray-300 mb-6">Defina o valor mínimo e o tempo do leilão.</p>
        <div className="mb-4">
          <label className="text-sm text-gray-200 font-semibold mb-2 block">Valor Mínimo (R$)</label>
          <input
            type="number"
            value={minBid}
            onChange={(e) => setMinBid(Number(e.target.value))}
            className="w-full bg-neutral-800/50 border border-yellow-700/50 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
          />
        </div>
        <div className="mb-6">
          <label className="text-sm text-gray-200 font-semibold mb-2 block">Tempo (horas)</label>
          <input
            type="number"
            value={auctionTime}
            onChange={(e) => setAuctionTime(Number(e.target.value))}
            className="w-full bg-neutral-800/50 border border-yellow-700/50 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
          />
        </div>
        <button
          onClick={createAuction}
          disabled={!minBid || auctionTime <= 0}
          className="w-full bg-yellow-500 text-black py-3 rounded-full font-bold disabled:opacity-50 hover:brightness-105 transition shadow"
        >
          Listar Item
        </button>
      </motion.div>
    </motion.div>
  );
}
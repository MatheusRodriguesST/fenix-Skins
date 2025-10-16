// src/components/CartSidebar.tsx
import React from "react";
import { motion } from "framer-motion";
import { X, Minus, Plus, Trash2, CreditCard } from "lucide-react";

interface CartLine {
  item: any;
  qty: number;
}

interface CartSidebarProps {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cart: CartLine[];
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  cartTotal: number;
  confirmCheckout: () => void;
  setCart: (cart: CartLine[]) => void;
}

export default function CartSidebar({
  cartOpen,
  setCartOpen,
  cart,
  updateQty,
  removeFromCart,
  cartTotal,
  confirmCheckout,
  setCart,
}: CartSidebarProps) {
  if (!cartOpen) return null;

  return (
    <motion.div className="fixed inset-0 z-50 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex-1 bg-black/50" onClick={() => setCartOpen(false)} />
      <motion.div className="w-full max-w-md bg-neutral-900/95 border-l border-yellow-700/50 p-6 shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 15, stiffness: 200 }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-100">Seu Carrinho</h3>
          <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-200"><X className="w-6 h-6" /></button>
        </div>

        {cart.length === 0 ? (
          <div className="text-center text-gray-300 py-8">Seu carrinho está vazio. Adicione itens!</div>
        ) : (
          <div className="space-y-6">
            {cart.map((line) => (
              <motion.div
                key={line.item.id}
                className="flex items-center gap-4 bg-neutral-800/30 rounded-2xl p-4 shadow"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="w-16 h-16 bg-neutral-800/50 rounded-xl overflow-hidden flex items-center justify-center">
                  {line.item.image ? <img src={line.item.image} className="max-h-14 object-contain" /> : <span className="text-sm text-gray-500">Sem imagem</span>}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-100">{line.item.skin}</p>
                  <p className="text-sm text-gray-300">R$ {line.item.price.toFixed(2)} cada</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => updateQty(line.item.id, line.qty - 1)} className="p-1.5 rounded-full bg-neutral-700/50"><Minus className="w-4 h-4" /></button>
                    <div className="text-base font-bold">{line.qty}</div>
                    <button onClick={() => updateQty(line.item.id, line.qty + 1)} className="p-1.5 rounded-full bg-neutral-700/50"><Plus className="w-4 h-4" /></button>
                    <button onClick={() => removeFromCart(line.item.id)} className="ml-auto text-red-400"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="p-4 bg-neutral-900/30 rounded-2xl border border-yellow-700/30 shadow-2xl">
              <div className="flex justify-between text-base font-semibold text-gray-100 mb-4">Total <span>R$ {cartTotal.toFixed(2)}</span></div>
              <div className="flex gap-4">
                <button onClick={confirmCheckout} className="flex-1 bg-yellow-500 text-black py-3 rounded-full font-bold flex items-center justify-center gap-2 shadow hover:brightness-105 transition"><CreditCard className="w-5 h-5" /> Pagar</button>
                <button onClick={() => { setCart([]); setCartOpen(false); }} className="px-6 py-3 border border-yellow-700/50 rounded-full font-bold hover:bg-yellow-800/50 transition">Limpar</button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
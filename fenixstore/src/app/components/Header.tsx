// src/components/Header.tsx
"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  User,
  LogIn,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react";

interface HeaderProps {
  query: string;
  setQuery: (q: string) => void;
  cartLength: number;
  setCartOpen: (open: boolean) => void;
  loadingUser: boolean;
  user: any | null;
  setShowTradeModal: (show: boolean) => void;
  setViewMode: (mode: "market" | "auction" | "inventory") => void;
}

export default function Header({ query, setQuery, cartLength, setCartOpen, loadingUser, user, setShowTradeModal, setViewMode }: HeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  function startSteamLogin() {
    window.location.href = "/api/auth/steam/login";
  }

  function handleLogout() {
    window.location.href = "/api/auth/logout";
  }

  return (
    <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md shadow-xl border-b border-yellow-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-400 flex items-center justify-center shadow-lg"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 1L9 6l-5 1 4 2-1 4 5-2 5 2-1-4 4-2-5-1L12 1z" fill="black" opacity="0.9"/></svg>
          </motion.div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-yellow-400">Fênix Skins</h1>
            <p className="text-sm text-gray-300">Mercado premium de skins com leilões</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar skins, armas..." className="w-80 bg-neutral-900/50 border border-yellow-700/50 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 shadow-sm transition-all" />
          </div>

          <button onClick={() => setCartOpen(true)} className="relative p-2.5 rounded-full hover:bg-yellow-800/50 transition shadow-sm">
            <ShoppingCart className="w-6 h-6 text-gray-200" />
            {cartLength > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full px-2 text-xs font-bold shadow">{cartLength}</span>
            )}
          </button>

          {loadingUser ? (
            <div className="animate-pulse w-32 h-10 bg-neutral-800 rounded-full" />
          ) : user ? (
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-3 bg-neutral-900/50 p-2 rounded-full border border-yellow-700/50 shadow-sm hover:bg-yellow-800/50 transition">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-yellow-700" />
                ) : (
                  <User className="w-10 h-10 text-gray-300 p-2" />
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-100">{user.display_name ?? user.id}</p>
                  <p className="text-xs text-yellow-400">R$ {(user.balance ?? 0).toFixed(2)}</p>
                </div>
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-48 bg-neutral-900/95 rounded-xl shadow-xl border border-yellow-700/50 overflow-hidden z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", damping: 15 }}
                  >
                    <button onClick={() => { setProfileMenuOpen(false); setViewMode("inventory"); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-yellow-800/50 transition">
                      <User className="w-5 h-5 text-gray-400" /> Perfil
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-yellow-800/50 transition">
                      <Wallet className="w-5 h-5 text-yellow-400" /> Depositar
                    </button>
                    <button onClick={() => setShowTradeModal(true)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-yellow-800/50 transition">
                      <Settings className="w-5 h-5 text-gray-400" /> Configurações
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-yellow-800/50 transition">
                      <LogOut className="w-5 h-5" /> Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={startSteamLogin} className="flex items-center gap-2 bg-yellow-500 text-black font-bold px-4 py-2.5 rounded-full shadow-md hover:brightness-105 transition">
              <LogIn className="w-5 h-5" /> Entrar com Steam
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
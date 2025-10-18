// src/components/Header.tsx
"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, User, LogIn, Wallet, Settings, LogOut, ChevronDown, Flame } from "lucide-react";
import { useClickAway } from "../../hooks/useClickAway"; 

interface HeaderProps {
  query: string;
  setQuery: (q: string) => void;
  cartLength: number;
  setCartOpen: (open: boolean) => void;
  loadingUser: boolean;
  user: any | null;
  setShowTradeModal: (show: boolean) => void;
  viewMode: "market" | "auction" | "inventory" | "raffles"; // Adicionado "raffles" para sorteios
  setViewMode: (mode: "market" | "auction" | "inventory" | "raffles") => void;
}

const navItems = [
  { label: "Mercado", mode: "market" },
  { label: "Feirão", mode: "auction" },
  { label: "Sorteios", mode: "raffles" }, // Adicionado item para Sorteios
];

export default function Header({ 
  query, setQuery, cartLength, setCartOpen, loadingUser, user, 
  setShowTradeModal, viewMode, setViewMode 
}: HeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useClickAway(profileRef, () => setProfileMenuOpen(false));

  function startSteamLogin() {
    window.location.href = "/api/auth/steam/login";
  }

  function handleLogout() {
    window.location.href = "/api/auth/logout";
  }

  return (
    <header className="sticky top-0 z-30 bg-neutral-950/70 backdrop-blur-lg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20"
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Flame className="w-6 h-6 text-black" />
            </motion.div>
            <h1 className="text-xl font-bold tracking-tight text-gray-100 hidden sm:block">
              Fênix<span className="text-yellow-400">Skins</span>
            </h1>
          </div>

          {/* Navegação Central */}
          <nav className="hidden md:flex items-center gap-2 bg-neutral-900/50 p-1.5 rounded-full border border-neutral-700/80">
            {navItems.map((item) => (
              <button
                key={item.mode}
                onClick={() => setViewMode(item.mode)}
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  viewMode === item.mode ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
                {viewMode === item.mode && (
                  <motion.div
                    className={`absolute inset-0 rounded-full ${
                      item.mode === "raffles" 
                        ? "bg-gradient-to-r from-orange-500/30 to-red-500/30 shadow-lg shadow-orange-500/20 animate-pulse" 
                        : "bg-yellow-500/20"
                    }`}
                    layoutId="active-nav-link"
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 25,
                      ...(item.mode === "raffles" && { repeat: Infinity, repeatType: "reverse", duration: 2 })
                    }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Ações do Usuário */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCartOpen(true)} 
              className="relative p-3 rounded-full text-gray-300 hover:bg-neutral-800/80 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartLength > 0 && (
                <motion.span 
                  className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-yellow-500 text-black rounded-full text-xs font-bold shadow"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {cartLength}
                </motion.span>
              )}
            </button>

            {loadingUser ? (
              <div className="w-12 h-12 bg-neutral-800 rounded-full animate-pulse" />
            ) : user ? (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full bg-neutral-900/50 hover:bg-neutral-800/80 border border-neutral-700/80 transition-colors"
                >
                  <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full" />
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 mr-1 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-3 w-64 bg-neutral-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-yellow-700/30 overflow-hidden z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    >
                      {/* Menu Header */}
                      <div className="p-4 flex items-center gap-4 border-b border-neutral-700/50">
                        <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full" />
                        <div>
                          <p className="font-semibold text-gray-100 truncate">{user.name ?? user.steam_id}</p>
                          <p className="text-xs text-gray-400">Nível 42</p> {/* Exemplo */}
                        </div>
                      </div>
                      
                      {/* Saldo e Depósito */}
                      <div className="p-4 space-y-2">
                        <p className="text-xs text-gray-400">Saldo na Carteira</p>
                        <div className="flex items-center justify-between">
                            <p className="text-xl font-bold text-yellow-400">R$ {(user.balance ?? 0).toFixed(2)}</p>
                            <button className="flex items-center gap-2 bg-yellow-500 text-black text-xs font-bold px-3 py-1.5 rounded-full hover:brightness-110 transition">
                                <Wallet className="w-4 h-4" /> Depositar
                            </button>
                        </div>
                      </div>

                      {/* Links de Navegação */}
                      <div className="p-2">
                        <button onClick={() => { setProfileMenuOpen(false); setViewMode("inventory"); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-gray-200 hover:bg-neutral-800/80 transition">
                          <User className="w-5 h-5 text-gray-400" /> Inventário & Perfil
                        </button>
                        <button onClick={() => { setProfileMenuOpen(false); setShowTradeModal(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-gray-200 hover:bg-neutral-800/80 transition">
                          <Settings className="w-5 h-5 text-gray-400" /> URL de Troca
                        </button>
                      </div>
                      
                      <div className="p-2 border-t border-neutral-700/50">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition">
                          <LogOut className="w-5 h-5" /> Sair
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button 
                onClick={startSteamLogin} 
                className="flex items-center gap-2 bg-[#1b2838] text-white font-bold px-4 py-2.5 rounded-full shadow-md hover:bg-[#2c435c] transition-colors"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <LogIn className="w-5 h-5" /> Entrar com Steam
              </motion.button>
            )}
          </div>
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-yellow-700/50 to-transparent"></div>
    </header>
  );
}
// src/components/Sidebar.tsx
import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Search } from "lucide-react";

interface SidebarProps {
  viewMode: "market" | "auction" | "inventory";
  setViewMode: (mode: "market" | "auction" | "inventory") => void;
  query: string;
  setQuery: (q: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  categories: string[];
  conditionFilter: string[];
  setConditionFilter: (filters: string[]) => void;
  conditions: string[];
  priceMin: number | "";
  setPriceMin: (min: number | "") => void;
  priceMax: number | "";
  setPriceMax: (max: number | "") => void;
  onlyTradable: boolean;
  setOnlyTradable: (trad: boolean) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export default function Sidebar({
  viewMode,
  setViewMode,
  query,
  setQuery,
  category,
  setCategory,
  categories,
  conditionFilter,
  setConditionFilter,
  conditions,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  onlyTradable,
  setOnlyTradable,
  sortBy,
  setSortBy,
}: SidebarProps) {
  return (
    <aside className="lg:col-span-3 bg-neutral-900/40 backdrop-blur-md p-6 rounded-3xl border border-yellow-700/30 shadow-2xl h-fit sticky top-24">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-100 mb-4">Navegação</h3>
        <nav className="flex flex-col gap-3">
          <motion.button
            onClick={() => setViewMode("market")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition shadow-sm ${viewMode === "market" ? "bg-yellow-500 text-black" : "bg-neutral-800/50 text-gray-200 hover:bg-yellow-700/50"}`}
            whileHover={{ scale: 1.05 }}
          >
            Mercado
          </motion.button>
          <motion.button
            onClick={() => setViewMode("auction")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition shadow-sm ${viewMode === "auction" ? "bg-yellow-500 text-black" : "bg-neutral-800/50 text-gray-200 hover:bg-yellow-700/50"}`}
            whileHover={{ scale: 1.05 }}
          >
            Leilão
          </motion.button>
          <motion.button
            onClick={() => setViewMode("inventory")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition shadow-sm ${viewMode === "inventory" ? "bg-yellow-500 text-black" : "bg-neutral-800/50 text-gray-200 hover:bg-yellow-700/50"}`}
            whileHover={{ scale: 1.05 }}
          >
            Inventário
          </motion.button>
        </nav>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-200 font-semibold mb-2 block">Buscar</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar skins..." className="w-full bg-neutral-800/50 border border-yellow-700/50 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all" />
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-200 font-semibold mb-2 block">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <motion.button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition shadow-sm ${category === c ? "bg-yellow-500 text-black" : "bg-neutral-800/50 text-gray-200 hover:bg-yellow-700/50"}`}
              whileHover={{ scale: 1.05 }}
            >
              {c}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-200 font-semibold mb-2 block">Condição</label>
        <div className="flex flex-col gap-3">
          {conditions.map((c) => (
            <label key={c} className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={conditionFilter.includes(c)} onChange={(e) => setConditionFilter(e.target.checked ? [...conditionFilter, c] : conditionFilter.filter(x => x !== c))} className="w-5 h-5 accent-yellow-500 rounded" />
              <span className="text-gray-200">{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-200 font-semibold mb-2 block">Preço (R$)</label>
        <div className="flex gap-3">
          <input type="number" placeholder="Min" value={priceMin as any} onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))} className="w-1/2 bg-neutral-800/50 border border-yellow-700/50 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all" />
          <input type="number" placeholder="Max" value={priceMax as any} onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))} className="w-1/2 bg-neutral-800/50 border border-yellow-700/50 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all" />
        </div>
        <label className="mt-3 flex items-center gap-3 text-sm text-gray-200">
          <input type="checkbox" checked={onlyTradable} onChange={(e) => setOnlyTradable(e.target.checked)} className="w-5 h-5 accent-yellow-500 rounded" /> Apenas tradáveis
        </label>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-200 font-semibold mb-2 block">Ordenar por</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-neutral-800/50 border border-yellow-700/50 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all">
          <option value="recent">Mais recentes</option>
          <option value="priceLow">Preço: baixo → alto</option>
          <option value="priceHigh">Preço: alto → baixo</option>
        </select>
      </div>

      <div className="p-4 bg-neutral-900/30 rounded-2xl border border-yellow-700/30 shadow-2xl">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-3"><AlertTriangle className="w-5 h-5 text-yellow-400" /> Como funciona</h4>
        <ul className="space-y-2 text-xs text-gray-300">
          <li>• Compre skins diretamente dos bots ou leiloe.</li>
          <li>• Use seu saldo para pagamentos e lances.</li>
          <li>• 5% de taxa em vendas, leilões dinâmicos.</li>
        </ul>
      </div>
    </aside>
  );
}
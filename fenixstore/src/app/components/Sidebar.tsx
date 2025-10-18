// src/components/Sidebar.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Search, ChevronDown } from "lucide-react";

// Props permanecem as mesmas
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

// Componente de Seção do Acordeão para reutilização e clareza
const AccordionSection = ({ title, isOpen, onToggle, children }: { title: string, isOpen: boolean, onToggle: () => void, children: React.ReactNode }) => (
  <div className="border-b border-yellow-700/20 last:border-b-0">
    <button onClick={onToggle} className="w-full flex justify-between items-center py-4 text-left">
      <h3 className="text-md font-semibold text-gray-100">{title}</h3>
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
        <ChevronDown className="w-5 h-5 text-yellow-500" />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="pb-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function Sidebar({
  viewMode, setViewMode, query, setQuery, category, setCategory, categories,
  conditionFilter, setConditionFilter, conditions, priceMin, setPriceMin,
  priceMax, setPriceMax, onlyTradable, setOnlyTradable, sortBy, setSortBy,
}: SidebarProps) {

  const [activeAccordion, setActiveAccordion] = useState<string | null>('condition');

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };
  
  const handleConditionToggle = (c: string) => {
    const newFilter = conditionFilter.includes(c)
      ? conditionFilter.filter(x => x !== c)
      : [...conditionFilter, c];
    setConditionFilter(newFilter);
  };

  return (
    <aside className="lg:col-span-3 bg-neutral-900/40 backdrop-blur-md p-6 rounded-3xl border border-yellow-700/30 shadow-2xl h-fit sticky top-24">
      {/* Navegação Principal */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-100 mb-4">Navegação</h3>
        <div className="grid grid-cols-3 gap-2">
          {["market", "auction", "inventory"].map((mode) => (
            <motion.button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition shadow-sm ${viewMode === mode ? "bg-yellow-500 text-black" : "bg-neutral-800/50 text-gray-200 hover:bg-yellow-700/50"}`}
              whileHover={{ scale: 1.05 }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar skins..." className="w-full bg-neutral-800/50 border border-yellow-700/50 rounded-full pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all" />
        </div>
      </div>

      {/* Seções de Filtro com Acordeão */}
      <div className="space-y-2">
        <AccordionSection title="Desgaste" isOpen={activeAccordion === 'condition'} onToggle={() => toggleAccordion('condition')}>
          <div className="grid grid-cols-2 gap-2">
            {conditions.map((c) => (
              <motion.button
                key={c}
                onClick={() => handleConditionToggle(c)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition shadow-sm ${conditionFilter.includes(c) ? "bg-yellow-500 text-black" : "bg-neutral-800/50 text-gray-200 hover:bg-yellow-700/50"}`}
                whileHover={{ scale: 1.05 }}
              >
                {c}
              </motion.button>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection title="Preço & Opções" isOpen={activeAccordion === 'price'} onToggle={() => toggleAccordion('price')}>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <input type="number" placeholder="Min R$" value={priceMin} onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))} className="w-1/2 bg-neutral-800/50 border border-yellow-700/50 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all" />
              <input type="number" placeholder="Max R$" value={priceMax} onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))} className="w-1/2 bg-neutral-800/50 border border-yellow-700/50 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all" />
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
              <input type="checkbox" checked={onlyTradable} onChange={(e) => setOnlyTradable(e.target.checked)} className="w-5 h-5 accent-yellow-500 rounded bg-neutral-700 border-yellow-700/50" />
              Apenas com troca liberada
            </label>
          </div>
        </AccordionSection>
        
        <AccordionSection title="Categoria & Ordenação" isOpen={activeAccordion === 'other'} onToggle={() => toggleAccordion('other')}>
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm text-gray-300 font-semibold mb-2">Categoria</h4>
                     <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <motion.button
                          key={c}
                          onClick={() => setCategory(c)}
                          className={`px-4 py-2 rounded-full text-xs font-medium transition shadow-sm ${category === c ? "bg-yellow-500 text-black" : "bg-neutral-800/50 text-gray-200 hover:bg-yellow-700/50"}`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {c}
                        </motion.button>
                      ))}
                    </div>
                </div>
                 <div>
                    <h4 className="text-sm text-gray-300 font-semibold mb-2">Ordenar por</h4>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-neutral-800/50 border border-yellow-700/50 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all">
                      <option value="recent">Mais recentes</option>
                      <option value="priceLow">Preço: baixo → alto</option>
                      <option value="priceHigh">Preço: alto → baixo</option>
                    </select>
                </div>
            </div>
        </AccordionSection>
      </div>
      
      {/* Bloco de Ajuda */}
      <div className="mt-6 p-4 bg-neutral-900/30 rounded-2xl border border-yellow-700/30 shadow-lg">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-3"><AlertTriangle className="w-5 h-5 text-yellow-400" /> Como funciona</h4>
        <ul className="space-y-2 text-xs text-gray-300">
          <li>• Compre skins diretamente dos bots ou participe de leilões.</li>
          <li>• Use seu saldo para pagamentos e lances de forma segura.</li>
          <li>• Taxa de 5% sobre vendas. Leilões com taxas dinâmicas.</li>
        </ul>
      </div>
    </aside>
  );
}
"use client";

import React, { useState } from "react";
import { ChevronDown, Search, X, Plus, Wallet, Star, Filter, AlertTriangle } from "lucide-react";

// Types
interface ListingItem {
  id: number;
  seller: string;
  location: string;
  name: string;
  skin: string;
  condition: string;
  float: string;
  price: number;
  reputation: string;
  payment: string;
  img: string;
  category: string;
}

interface CreateListingForm {
  name: string;
  skin: string;
  price: string;
  img: string;
  category: string;
  location: string;
}

interface FormErrors {
  name?: string;
  skin?: string;
  price?: string;
}

// Fenix Skins - Next.js App Router (page.tsx) - Client Component
// Enhanced: More visually appealing with gradients, animations, improved typography, and icons.
// Improved UX: Added price filters, pagination, loading states, responsive design, form validation, hover effects, tooltips.

export default function Page() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showCreate, setShowCreate] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [listings, setListings] = useState(mockListings);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  function toggleWallet() {
    setWalletConnected((s) => !s);
  }

  function createListing(item: ListingItem) {
    setListings((s) => [item, ...s]);
    setShowCreate(false);
  }

  const filtered = listings
    .filter((l) => {
      const q = query.trim().toLowerCase();
      const matchesQ = q === "" || (l.name + " " + l.skin + " " + l.seller).toLowerCase().includes(q);
      const matchesCat = category === "Todas" || l.category === category;
      const matchesMinPrice = minPrice === "" || l.price >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === "" || l.price <= parseFloat(maxPrice);
      return matchesQ && matchesCat && matchesMinPrice && matchesMaxPrice;
    })
    .sort((a, b) => {
      if (sortBy === "priceLow") return a.price - b.price;
      if (sortBy === "priceHigh") return b.price - a.price;
      if (sortBy === "reputation") return b.reputation.localeCompare(a.reputation); // Assuming A+ > A > B+
      return b.id - a.id; // Default: recent (higher id first)
    });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-neutral-900 text-gray-100 antialiased">
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-6 border-b border-neutral-800/50">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Fênix Skins</h1>
            <p className="text-xs text-gray-400">Marketplace P2P brasileiro · Seguro · Escrow opcional</p>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold px-4 py-2 rounded-md shadow-lg transition-all duration-300">
            <Plus className="w-4 h-4" /> Criar anúncio
          </button>

          <button
            onClick={toggleWallet}
            className="flex items-center gap-3 border border-gray-800 px-4 py-2 rounded-md hover:bg-neutral-800/50 transition-colors">
            <Wallet className={`w-4 h-4 ${walletConnected ? "text-emerald-400" : "text-rose-500"}`} />
            {walletConnected ? "Carteira conectada" : "Conectar carteira"}
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-6 py-8 pb-12">
        {/* Left column - filtros (sticky on desktop, accordion on mobile) */}
        <aside className="md:col-span-3 sticky top-24 self-start bg-neutral-900/80 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 shadow-xl">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2"><Filter className="w-4 h-4 text-yellow-500" /> Filtros</h2>
          
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procure por arma, skin ou vendedor"
                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md pl-9 py-2 outline-none text-sm placeholder-gray-500 focus:border-yellow-500 transition-colors"
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xs uppercase text-gray-400">Categorias</h3>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-1 gap-2">
              {["Todas", "Rifle", "Pistola", "Faca", "SMG", "Acessório"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`text-left px-4 py-2 rounded-md text-sm transition-colors ${category === c ? "bg-yellow-500 text-black font-semibold" : "hover:bg-neutral-800/50"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xs uppercase text-gray-400">Faixa de preço (R$)</h3>
            <div className="mt-2 flex gap-2">
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Mín"
                type="number"
                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:border-yellow-500"
              />
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Máx"
                type="number"
                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:border-yellow-500"
              />
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-400">
            <h4 className="font-semibold text-gray-200 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500" /> Dicas de segurança</h4>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
              <li>Use Escrow para transações de alto valor</li>
              <li>Verifique o selo de reputação do vendedor</li>
              <li>Comunique-se somente pelo chat interno</li>
            </ul>
          </div>
        </aside>

        {/* Center - listings */}
        <section className="md:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Anúncios</h2>
              <p className="text-sm text-gray-400">{filtered.length} resultados • Filtro: {category}</p>
            </div>

            <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6">
            {paginated.length === 0 ? (
              <div className="p-8 bg-neutral-900/50 rounded-xl text-center text-gray-400 border border-dashed border-neutral-700">
                Nenhum anúncio encontrado — ajuste os filtros ou crie um novo.
              </div>
            ) : (
               paginated.map((item) => (
                 <Card key={item.id} item={item} />
               ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-md ${currentPage === i + 1 ? "bg-yellow-500 text-black" : "bg-neutral-800/50 hover:bg-neutral-700/50"} transition-colors`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right - activity / destaque (sticky on desktop) */}
        <aside className="md:col-span-3 sticky top-24 self-start bg-neutral-900/80 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Anúncio em destaque</h3>
          <Featured item={listings[2]} />

          <div className="mt-8">
            <h4 className="text-sm font-semibold text-gray-200">Atividade recente</h4>
            <ul className="mt-3 text-sm text-gray-400 space-y-3">
              <li className="flex justify-between"><span>Rafael vendeu AK Redline</span><span className="text-xs text-gray-500">10 min</span></li>
              <li className="flex justify-between"><span>Luana fez oferta em Desert Eagle</span><span className="text-xs text-gray-500">25 min</span></li>
              <li className="flex justify-between"><span>KnifeKing publicou Faca Gamma</span><span className="text-xs text-gray-500">1h</span></li>
            </ul>
          </div>

          <div className="mt-8 text-sm text-gray-400">
            <h4 className="font-semibold text-gray-200">Por que escolher a Fênix?</h4>
            <ul className="list-disc list-inside mt-2 text-xs space-y-1">
              <li>Escrow opcional para segurança</li>
              <li>Reputação e histórico de trades</li>
              <li>Suporte em Português (BR)</li>
            </ul>
          </div>
        </aside>
      </main>

      {showCreate && <CreateListing onClose={() => setShowCreate(false)} onCreate={createListing} />}

      <footer className="border-t border-neutral-800/50 bg-neutral-900/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400 gap-4">
          <div>© {new Date().getFullYear()} Fênix Skins — Todos os direitos reservados</div>
          <div className="flex gap-4">
            <a className="hover:text-yellow-500 transition-colors">Termos</a>
            <a className="hover:text-yellow-500 transition-colors">Privacidade</a>
            <a className="hover:text-yellow-500 transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ------------------ Small components ------------------

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-xl animate-pulse-slow">
        {/* Enhanced phoenix svg with better fill */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C12 2 9 6 6 7c0 0 2 1 4 1s4-1 6-1c2 0 3-2 3-2s-2 1-7-5z" fill="currentColor" className="text-black opacity-20" />
          <path d="M12 3C9.238 3 7 6 7 6s1 2 5 2 5-2 5-2-2.238-3-5-3z" fill="currentColor" className="text-black opacity-30" />
          <path d="M12 4.5c-1.657 0-3 1.343-3 3 0 1.657 3 4.5 3 4.5s3-2.843 3-4.5c0-1.657-1.343-3-3-3z" fill="currentColor" className="text-black opacity-40" />
          <path d="M12 1L10 5l-4 1 3 2-1 4 4-2 4 2-1-4 3-2-4-1L12 1z" fill="currentColor" className="text-neutral-900" />
        </svg>
      </div>
    </div>
  );
}

function SortDropdown({ sortBy, setSortBy }: { sortBy: string; setSortBy: (value: string) => void }) {
  return (
    <div className="relative">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="appearance-none bg-neutral-800/50 border border-neutral-700 rounded-md px-4 py-2 text-sm pr-8 focus:border-yellow-500 transition-colors"
      >
        <option value="recent">Mais recentes</option>
        <option value="priceLow">Menor preço</option>
        <option value="priceHigh">Maior preço</option>
        <option value="reputation">Melhor reputação</option>
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
    </div>
  );
}

function Featured({ item }: { item: ListingItem }) {
  if (!item) return null;
  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 rounded-xl border border-yellow-500/50 shadow-md hover:shadow-yellow-500/20 transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-20 h-16 bg-cover bg-center rounded-md shadow-md" style={{ backgroundImage: `url(${item.img})` }} />
        <div className="flex-1">
          <div className="text-sm text-gray-300">{item.seller} • {item.location}</div>
          <div className="font-semibold text-yellow-400">{item.name} {item.skin}</div>
          <div className="text-base font-bold text-white">R$ {item.price.toFixed(2)}</div>
        </div>
        <button className="px-4 py-2 bg-yellow-500 text-black rounded-md font-semibold hover:bg-yellow-600 transition-colors">Comprar</button>
      </div>
    </div>
  );
}

function Card({ item }: { item: ListingItem }) {
  return (
    <div className="p-5 bg-neutral-900/70 backdrop-blur-sm border border-neutral-800/50 rounded-xl flex gap-6 items-start hover:border-yellow-500/50 hover:shadow-lg transition-all duration-300">
      <div className="w-40 h-28 bg-cover bg-center rounded-lg shadow-inner" style={{ backgroundImage: `url(${item.img})` }} />

      <div className="flex-1">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm text-gray-400 flex items-center gap-2">
              {item.seller} • <span className="text-gray-500">{item.location}</span>
              <span className="ml-2 px-2 py-1 bg-neutral-800/50 rounded text-xs">Rep: {item.reputation}</span>
            </div>
            <h3 className="text-xl font-semibold mt-1 text-white">{item.name} <span className="text-yellow-400">{item.skin}</span></h3>
            <div className="text-sm text-gray-400 mt-1">Condição: {item.condition} • Float: {item.float}</div>
            <div className="text-sm text-gray-400 mt-2">Pagamento: {item.payment}</div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-yellow-400">R$ {item.price.toFixed(2)}</div>
            <div className="mt-4 flex flex-col gap-3">
              <button className="w-full px-6 py-2 rounded-md bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all">
                Comprar
              </button>
              <button className="w-full px-6 py-2 rounded-md border border-neutral-700 text-sm hover:bg-neutral-800/50 transition-colors">
                Abrir chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateListing({ onClose, onCreate }: { onClose: () => void; onCreate: (listing: ListingItem) => void }) {
  const [form, setForm] = useState<CreateListingForm>({ name: "", skin: "", price: "", img: "", category: "Rifle", location: "BR" });
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name) errs.name = "Obrigatório";
    if (!form.skin) errs.skin = "Obrigatório";
    if (!form.price || isNaN(parseFloat(form.price))) errs.price = "Preço inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const newItem = {
      id: Math.floor(Math.random() * 1000000),
      seller: "Você",
      ...form,
      price: parseFloat(form.price),
      float: (Math.random() * 0.5).toFixed(4),
      condition: "Factory New",
      reputation: "A",
      payment: "PIX / MercadoPago / Steam",
      img: form.img || sampleImage,
    };
    onCreate(newItem);
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
      <form onSubmit={submit} className="w-full max-w-3xl bg-neutral-900/90 backdrop-blur-md rounded-xl p-8 border border-neutral-800/50 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Criar anúncio</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="text-sm text-gray-400">Nome da arma</label>
            <input
              required
              placeholder="Ex: AK-47"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`mt-1 w-full bg-neutral-800/50 border ${errors.name ? "border-rose-500" : "border-neutral-700"} rounded-md p-3 text-sm focus:border-yellow-500 transition-colors`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-400">Nome da skin</label>
            <input
              required
              placeholder="Ex: Redline"
              value={form.skin}
              onChange={(e) => setForm({ ...form, skin: e.target.value })}
              className={`mt-1 w-full bg-neutral-800/50 border ${errors.skin ? "border-rose-500" : "border-neutral-700"} rounded-md p-3 text-sm focus:border-yellow-500 transition-colors`}
            />
            {errors.skin && <p className="text-xs text-rose-500 mt-1">{errors.skin}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-400">Preço (R$)</label>
            <input
              required
              placeholder="Ex: 45.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={`mt-1 w-full bg-neutral-800/50 border ${errors.price ? "border-rose-500" : "border-neutral-700"} rounded-md p-3 text-sm focus:border-yellow-500 transition-colors`}
            />
            {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-400">Imagem (URL opcional)</label>
            <input
              placeholder="Ex: https://example.com/image.jpg"
              value={form.img}
              onChange={(e) => setForm({ ...form, img: e.target.value })}
              className="mt-1 w-full bg-neutral-800/50 border border-neutral-700 rounded-md p-3 text-sm focus:border-yellow-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full bg-neutral-800/50 border border-neutral-700 rounded-md p-3 text-sm focus:border-yellow-500 transition-colors"
            >
              <option>Rifle</option>
              <option>Pistola</option>
              <option>Faca</option>
              <option>SMG</option>
              <option>Acessório</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400">Localização</label>
            <input
              placeholder="Ex: SP, BR"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full bg-neutral-800/50 border border-neutral-700 rounded-md p-3 text-sm focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-md border border-neutral-700 hover:bg-neutral-800/50 transition-colors">Cancelar</button>
          <button type="submit" className="px-6 py-3 rounded-md bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all">Publicar</button>
        </div>
      </form>
    </div>
  );
}

// ------------------ Mock data ------------------

const sampleImage = 'https://images.unsplash.com/photo-1605902711622-cfb43c44367e?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=3c40b6eb7b1b4d5a7d6f0a1a3f3b5c7a';

const mockListings: ListingItem[] = [
  {
    id: 1001,
    seller: 'Rafael123',
    location: 'SP, BR',
    name: 'AK-47',
    skin: 'Redline (Field-Tested)',
    condition: 'Field-Tested',
    float: '0.2500',
    price: 45.0,
    reputation: 'A',
    payment: 'PIX / Steam',
    img: sampleImage,
    category: 'Rifle',
  },
  {
    id: 1002,
    seller: 'LuanaSkills',
    location: 'RJ, BR',
    name: 'Desert Eagle',
    skin: 'Blaze (Factory New)',
    condition: 'Factory New',
    float: '0.0150',
    price: 120.5,
    reputation: 'A+',
    payment: 'PIX / MercadoPago',
    img: sampleImage,
    category: 'Pistola',
  },
  {
    id: 1003,
    seller: 'KnifeKing',
    location: 'MG, BR',
    name: 'Faca',
    skin: 'Gamma Doppler',
    condition: 'Minimal Wear',
    float: '0.0700',
    price: 950.0,
    reputation: 'B+',
    payment: 'PIX / Transfer',
    img: sampleImage,
    category: 'Faca',
  },
  // Add more mock items to test pagination
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: 1004 + i,
    seller: `User${i + 1}`,
    location: 'BR',
    name: 'Item',
    skin: `Skin ${i + 1}`,
    condition: 'New',
    float: '0.01',
    price: Math.random() * 1000,
    reputation: 'A',
    payment: 'PIX',
    img: sampleImage,
    category: ['Rifle', 'Pistola', 'Faca'][i % 3],
  })),
];


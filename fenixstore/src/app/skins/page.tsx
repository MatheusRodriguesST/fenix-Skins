// app/skins/page.tsx
"use client";

import React, { useEffect, useState } from "react";

// Tipos para os dados que vamos manipular
type Bot = { steamId: string; name: string };
type InvItem = {
  id: string;
  name: string;
  image?: string | null;
  bot: string; // Adicionamos o nome do bot para exibição
};

export default function SkinsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedSkin, setSelectedSkin] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<InvItem[]>([]);
  const [uniqueSkins, setUniqueSkins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Busca a lista de bots disponíveis na nossa API
  useEffect(() => {
    fetch("/api/bots")
      .then((res) => res.json())
      .then((data) => setBots(data))
      .catch(() => setError("Não foi possível carregar a lista de bots."));
  }, []);

  // 2. Quando a lista de bots carregar, busca o inventário de cada um
  useEffect(() => {
    if (bots.length === 0) return;

    setLoading(true);
    setError(null);

    Promise.all(
      bots.map(async (bot) => {
        try {
          // Chama nossa API interna com URL relativa (corrige o erro 404)
          const res = await fetch(`/api/bots/${bot.steamId}/inventory`);
          if (!res.ok) {
            console.warn(`Falha ao buscar inventário do bot ${bot.name} (status: ${res.status})`);
            return []; // Retorna array vazio em caso de erro
          }
          const data = await res.json();

          // Nossa API já formatou os itens, basta usá-los!
          if (!data.ok || !data.items) {
            console.warn(`API retornou erro para o bot ${bot.name}: ${data.message}`);
            return [];
          }
          
          // Adiciona o nome do bot a cada item para saber de onde ele veio
          return data.items.map((item: unknown) => ({
            ...item,
            bot: bot.name,
          }));

        } catch (e) {
          console.error(`Erro de rede ao buscar inventário do bot ${bot.name}:`, e);
          return [];
        }
      })
    )
      .then((inventories) => {
        const flattenedItems = inventories.flat();
        setAllItems(flattenedItems);

        // Cria a lista de skins únicas (sem repetição) para o menu lateral
        const uniqueNames = [...new Set(flattenedItems.map((item) => item.name))].sort();
        setUniqueSkins(uniqueNames);

        // Seleciona a primeira skin da lista automaticamente
        if (uniqueNames.length > 0 && !selectedSkin) {
          setSelectedSkin(uniqueNames[0]);
        }
      })
      .catch(() => setError("Ocorreu um erro ao processar os inventários."))
      .finally(() => setLoading(false));

  }, [bots]); // Depende apenas de `bots`

  // Filtra os itens a serem exibidos com base na skin selecionada
  const filteredItems = selectedSkin
    ? allItems.filter((item) => item.name === selectedSkin)
    : [];

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">Fênix Skins — Inventário</h1>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Menu Lateral de Skins */}
          <aside className="w-full md:w-72 bg-neutral-900/60 p-4 rounded-lg border border-neutral-800 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Skins Disponíveis ({uniqueSkins.length})</h3>
            <ul className="space-y-1 overflow-y-auto max-h-[75vh]">
              {loading && uniqueSkins.length === 0 && <p className="text-gray-400">Carregando...</p>}
              {uniqueSkins.map((skin) => (
                <li key={skin}>
                  <button
                    onClick={() => setSelectedSkin(skin)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedSkin === skin
                        ? "bg-yellow-500 text-black font-bold"
                        : "hover:bg-neutral-800/50"
                    }`}
                  >
                    {skin}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Grid de Itens */}
          <main className="flex-1 bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              {selectedSkin ? `${selectedSkin} (${filteredItems.length})` : "Selecione uma skin"}
            </h3>

            {loading && <p className="text-gray-400">Buscando itens nos bots...</p>}
            
            {!loading && error && <p className="text-red-400">{error}</p>}

            {!loading && !error && filteredItems.length === 0 && (
              <p className="text-gray-400">
                {selectedSkin ? "Nenhum item encontrado." : "Nenhuma skin disponível para exibição."}
              </p>
            )}

            {!loading && filteredItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredItems.map((item) => (
                  <div key={item.id} className="bg-neutral-900/30 rounded-md p-2 text-center border border-neutral-700 hover:border-yellow-500 transition-colors">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-24 object-contain mb-2" />
                    ) : (
                      <div className="w-full h-24 bg-neutral-800 rounded mb-2 flex items-center justify-center text-gray-500 text-xs">Sem Imagem</div>
                    )}
                    <p className="text-xs text-gray-200 mt-2 truncate" title={item.name}>{item.name}</p>
                    <p className="text-xs text-gray-400">Bot: {item.bot}</p>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
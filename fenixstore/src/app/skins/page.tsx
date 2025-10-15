// app/skins/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type Bot = { steamId: string; name: string };
type InvItem = { id: string; name: string; image?: string | null };

export default function SkinsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [items, setItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/bots")
      .then((r) => r.json())
      .then((data) => {
        setBots(data);
        if (data?.length) setSelected(data[0].steamId);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`/api/bots/${selected}/inventory`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch((e) => {
        console.error(e);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">Fênix Skins — Inventários dos bots</h1>
        </header>

        <div className="flex gap-4 mb-6">
          <div className="w-64 bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
            <h3 className="text-sm text-gray-300 mb-2">Bots</h3>
            <ul className="space-y-2">
              {bots.map((b) => (
                <li key={b.steamId}>
                  <button
                    onClick={() => setSelected(b.steamId)}
                    className={`w-full text-left px-3 py-2 rounded ${selected === b.steamId ? "bg-yellow-500 text-black" : "hover:bg-neutral-800/50"}`}
                  >
                    {b.name}
                    <div className="text-xs text-gray-400">{b.steamId}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
            <h3 className="text-sm text-gray-300 mb-4">Inventário</h3>

            {loading ? (
              <div>Carregando inventário...</div>
            ) : items.length === 0 ? (
              <div className="text-gray-400">Nenhum item nesse bot.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map((it) => (
                  <div key={it.id} className="bg-neutral-900/30 rounded-md p-2 text-center">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="w-full h-24 object-cover rounded" />
                    ) : (
                      <div className="w-full h-24 bg-neutral-800 rounded mb-2" />
                    )}
                    <div className="text-xs text-gray-200 mt-2">{it.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

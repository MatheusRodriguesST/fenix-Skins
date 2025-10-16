"use client";

import React, { useEffect, useState } from "react";

type User = {
  id: string;
  display_name?: string;
  trade_url?: string;
  balance?: number;
};

export default function AuthWidget() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // CORREÇÃO: adicionar state de erro
  const [tradeUrlInput, setTradeUrlInput] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [addAmount, setAddAmount] = useState<string>("50.00");
  const [message, setMessage] = useState<string | null>(null);

  // fetchMe: busca /api/user/me e atualiza estados
  async function fetchMe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/me", {
        method: "GET",
        credentials: "same-origin", // garante envio de cookies (use 'include' se for cross-site)
        cache: "no-store",
      });

      // tenta ler json mesmo em erro para pegar mensagens do backend
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setUser(null);
        setError(json?.message || "Falha ao carregar dados do usuário.");
      } else {
        if (json?.ok) {
          setUser(json.user);
          // sincroniza o campo do input com o valor salvo no user
          setTradeUrlInput(json.user?.trade_url ?? "");
        } else {
          setUser(null);
          setError(json?.message || "Resposta inválida do servidor.");
        }
      }
    } catch (err) {
      console.error("fetchMe error:", err);
      setUser(null);
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  // chama fetchMe ao montar o componente
  useEffect(() => {
    fetchMe();
    // opcional: escutar focus para revalidar quando o usuário voltar da janela de login externa
    const onFocus = () => fetchMe();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  function startSteamLogin() {
    // redireciona para o fluxo de login Steam
    // se o Steam abrir em outra aba/janela e fizer callback, ao voltar a aba principal este componente revalidará por causa do 'focus' listener acima
    window.location.href = "/api/auth/steam/login";
  }

  async function saveTradeUrl() {
    setMessage(null);
    try {
      const res = await fetch("/api/user/trade-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ trade_url: tradeUrlInput }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setMessage("Erro: " + (j.message || "unknown"));
      } else {
        setMessage("Trade URL salvo.");
        fetchMe();
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro ao salvar trade URL.");
    }
  }

  async function addFunds() {
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/add-funds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ amount: Number(addAmount) }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setMessage("Erro: " + (j.message || "unknown"));
      } else {
        setMessage(`Saldo atualizado: R$ ${Number(j.balance).toFixed(2)}`);
        fetchMe();
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro ao adicionar fundos.");
    } finally {
      setAdding(false);
    }
  }

  // renderizações de estado
  if (loading) return <div className="p-4">Carregando...</div>;
  if (error)
    return <div className="p-4 text-red-500">Erro: {error}</div>;

  if (!user) {
    return (
      <div className="p-4">
        <button
          onClick={startSteamLogin}
          className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold"
        >
          Entrar com Steam
        </button>
        <div className="text-xs text-gray-400 mt-2">
          Ao entrar, você poderá cadastrar trade URL e receber pagamentos.
        </div>
      </div>
    );
  }

  // usuário autenticado
  return (
    <div className="p-4 bg-neutral-900/50 rounded-md border border-neutral-800">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-300 font-semibold">
            {user.display_name ?? user.id}
          </div>
          <div className="text-xs text-gray-400">Steam ID: {user.id}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-yellow-400 font-bold">
            R$ {(user.balance ?? 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">Saldo</div>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-400">Trade URL (para vender skins)</label>
        <input
          value={tradeUrlInput}
          onChange={(e) => setTradeUrlInput(e.target.value)}
          placeholder={
            user.trade_url ??
            "https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
          }
          className="w-full mt-2 px-3 py-2 bg-neutral-800/40 border border-neutral-700 rounded text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button onClick={saveTradeUrl} className="px-3 py-2 bg-yellow-500 text-black rounded">
            Salvar
          </button>
          <button
            onClick={() => {
              setTradeUrlInput(user.trade_url ?? "");
            }}
            className="px-3 py-2 border rounded"
          >
            Voltar ao salvo
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-400">Adicionar fundos (simulado)</label>
        <div className="mt-2 flex gap-2">
          <input
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            className="px-3 py-2 bg-neutral-800/40 border border-neutral-700 rounded text-sm w-32"
          />
          <button
            onClick={addFunds}
            disabled={adding}
            className="px-3 py-2 bg-green-600 rounded text-black font-semibold"
          >
            {adding ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>

      {message && <div className="mt-3 text-xs text-gray-200">{message}</div>}
    </div>
  );
}

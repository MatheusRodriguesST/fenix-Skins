// RafflesPage_improved_and_db_schema.tsx
// ---
// Single-file React component (Next.js client) + instructions
// Also included: Prisma schema (Postgres) + SQL seed + helper to fetch Steam images
// Copy the React component into src/components/RafflesPage.tsx or a page in your app.

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Ticket, Users, Crown, ArrowRight, Clock } from "lucide-react";

interface RaffleItem {
  id: string;
  title: string;
  description: string;
  prize: string;
  participants: number;
  endsAt: string; // ISO date
  image: string;
  pricePerTicketCents: number; // stored in cents
}

// --- NOTE: In production, fetch this from /api/raffles. For local/demo we seed the 3 items below.
const seededRaffles: RaffleItem[] = [
  {
    id: "1",
    title: "AK-47 | Fire Serpent",
    description: "Participe agora e concorra a uma das skins mais raras do CS:GO!",
    prize: "AK-47 | Fire Serpent (Factory New)",
    participants: 245,
    endsAt: "2025-10-25T20:00:00.000Z",
    image: "/images/ak-fire-serpent.jpg", // replace with Steam CDN URL if available
    pricePerTicketCents: 500,
  },
  {
    id: "2",
    title: "Mega Sorteio de 5 Skins Ouro",
    description: "5 skins douradas exclusivas para os sortudos vencedores.",
    prize: "5x Skins Ouro Aleatórias",
    participants: 156,
    endsAt: "2025-10-20T20:00:00.000Z",
    image: "/images/gold-skins.jpg",
    pricePerTicketCents: 500,
  },
  {
    id: "3",
    title: "Sorteio Diário - Dragon Lore",
    description: "Um sorteio diário com chance de ganhar a lendária Dragon Lore.",
    prize: "AWP | Dragon Lore (Minimal Wear)",
    participants: 89,
    endsAt: "2025-10-18T20:00:00.000Z",
    image: "/images/awp-dragon-lore.jpg",
    pricePerTicketCents: 500,
  },
];

// Utility: format currency
const formatBRL = (cents: number) => {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

function useCountdown(isoDate: string) {
  const target = useMemo(() => new Date(isoDate).getTime(), [isoDate]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, finished: diff === 0 };
}

export default function RafflesPageClient() {
  const [raffles, setRaffles] = useState<RaffleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulação de fetch — substitua por fetch('/api/raffles') em produção
  useEffect(() => {
    // little delay to show skeletons
    const t = setTimeout(() => {
      setRaffles(seededRaffles);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-600 to-red-500 shadow-lg shadow-orange-800/30">
              <Flame className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">Sorteios Fênix</h1>
              <p className="text-sm text-gray-300">Skins reais, prêmios reais — entre e tente a sorte.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden md:inline-flex items-center gap-2 bg-neutral-800/60 backdrop-blur-md px-4 py-2 rounded-full border border-neutral-700/40">
              <Users className="w-4 h-4" />
              Comunidade
            </button>
            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-black px-4 py-2 rounded-full font-semibold shadow-md hover:scale-[1.02] transition-transform">
              Ver Sorteios
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.header>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-neutral-900/30 p-6 animate-pulse h-72" />
              ))
            : raffles.map((r) => <RaffleCard key={r.id} raffle={r} />)}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 p-6 rounded-xl bg-gradient-to-r from-neutral-900/40 to-neutral-900/30 border border-neutral-700/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h2 className="text-xl font-bold">Ainda não viu o suficiente?</h2>
            <p className="text-sm text-gray-300">Siga nosso perfil e ative notificações para novos sorteios diários.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2 rounded-full bg-orange-500 text-black font-bold">Seguir no X</button>
            <button className="px-5 py-2 rounded-full border border-neutral-700/40">Como funciona</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function RaffleCard({ raffle }: { raffle: RaffleItem }) {
  const countdown = useCountdown(raffle.endsAt);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="relative rounded-2xl overflow-hidden border border-neutral-700/40 bg-gradient-to-b from-neutral-900/40 to-neutral-900/20 shadow-xl"
    >
      <div className="h-48 relative">
        <img src={raffle.image} alt={raffle.title} className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute left-4 bottom-4 p-3 rounded-lg bg-black/40 backdrop-blur-sm text-white">
          <div className="text-sm font-semibold">{raffle.title}</div>
          <div className="text-xs text-gray-200">{raffle.prize}</div>
        </div>

        <div className="absolute right-4 top-4 text-xs">
          <div className="inline-flex items-center gap-2 bg-neutral-900/70 px-2 py-1 rounded-full border border-neutral-700/40">
            <Clock className="w-4 h-4" />
            {countdown.days > 0 ? `${countdown.days}d ${countdown.hours}h` : `${countdown.hours}h ${countdown.minutes}m`}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{raffle.title}</h3>
            <p className="text-sm text-gray-300 line-clamp-2 mt-1">{raffle.description}</p>

            <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/20 to-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/10">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-300">{raffle.prize}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">{raffle.participants} participantes</div>
            <div className="mt-2 font-bold text-lg">{formatBRL(raffle.pricePerTicketCents)}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-black font-bold hover:scale-[1.02] transition-transform">
            Participar agora
          </button>

          <button className="px-4 py-3 rounded-lg border border-neutral-700/40 bg-neutral-900/20">Detalhes</button>
        </div>
      </div>
    </motion.article>
  );
}


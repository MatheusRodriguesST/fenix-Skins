// app/api/bots/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Em uma aplicação real, você buscaria isso de um banco de dados.
  // Por enquanto, usamos uma lista fixa para o exemplo funcionar.
  const bots = [
    {
      steamId: "76561199680448274", // SteamID do seu log de erro
      name: "Bot Fênix 01",
    }
    // Adicione mais bots aqui se precisar
  ];

  return NextResponse.json(bots);
}
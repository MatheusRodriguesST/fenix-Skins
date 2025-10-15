// pages/api/bots/index.ts
import { NextApiRequest, NextApiResponse } from "next";

/**
 * Simples lista de bots. Substitua pelas contas que você criar.
 * Cada bot precisa do steamId (string).
 */
const BOT_LIST = [
  { steamId: "76561198787178742", name: "FenixBot1" }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json(BOT_LIST);
}

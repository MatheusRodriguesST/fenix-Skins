import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-chave-padrão-para-dev"; // Use uma chave forte em produção!

export function sign(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }); // Expira em 7 dias
}

export function verify(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null; // Retorna null em caso de erro (ex: token inválido ou expirado)
  }
}
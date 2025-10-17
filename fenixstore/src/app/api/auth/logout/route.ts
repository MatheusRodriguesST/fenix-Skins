// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url)); // Usa req.url para base absoluta
  res.cookies.set({
    name: "fenix_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure em prod
    sameSite: "strict",
    path: "/",
    maxAge: 0, // Expira imediatamente
  });
  return res;
}
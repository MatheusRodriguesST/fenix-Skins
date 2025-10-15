// app/login/page.tsx
"use client";
import React from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4">Entrar com Steam</h1>
        <p className="text-sm text-gray-400 mb-6">Use sua conta Steam para entrar na Fênix Skins.</p>
        <a
          href="/api/auth/steam/login"
          className="inline-flex items-center gap-3 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-md shadow"
        >
          Entrar com Steam
        </a>
      </div>
    </div>
  );
}

// src/components/Footer.tsx
import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-yellow-700/30 mt-12 bg-neutral-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-sm text-gray-400 flex items-center justify-between">
        <p>© {new Date().getFullYear()} Fênix Skins. Todos os direitos reservados.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-yellow-400 transition">Termos de Uso</a>
          <a href="#" className="hover:text-yellow-400 transition">Política de Privacidade</a>
        </div>
      </div>
    </footer>
  );
}